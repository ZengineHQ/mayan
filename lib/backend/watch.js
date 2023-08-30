const http = require('http')
const urlModule = require('url')

const ngrok = require('ngrok')
const clipboardy = require('clipboardy')
const httpProxy = require('http-proxy')
const { green, italic, yellow, red, bold } = require('kleur')

const { context } = require('../context')
const { createScriptExecutable } = require('./tasks/runScript')
const { runWatcher } = require('./tasks/runWatcher')
const updateWebhookUrl = require('./tasks/updateWebhookUrl')
const { printErrorAndAbort, runScript, setNgrokUrl } = require('../util')

const onProxyError = printErrorAndAbort('backend http proxy')

module.exports = async argv => {
  // Start by gathering all the data we need to set things up properly
  const ctx = await context(argv).catch(err => err instanceof Error ? err : new Error(err))

  if (ctx instanceof Error) throw ctx

  const accessToken = ctx.accessToken || null

  let portIncrementer = 0

  const services = ctx.plugins.reduce((allServices, plugin) => [
    ...allServices,
    ...(plugin.services || []).map(srv => ({
      ...srv,
      proxy_settings: {
        ...ctx.proxy_settings,
        ...plugin.proxy_settings,
        ...srv.proxy_settings
      },
      namespaceRoute: `${plugin.namespace}${srv.route || `/${srv.configName}`}`,
      script: `backend/${srv.configName}/_runner/bin/www`,
      dir: `backend/${srv.configName}`,
      port: (srv.proxy_settings && srv.proxy_settings.port) || 3000 + portIncrementer++
    }))
  ], [])

  if (!services.length) return console.log('no backend services to watch')

  // spin up each backend service
  const liveServices = services
    .filter(service => argv.services[0] === '*' || argv.services.some(name => name === service.configName))
    .map(service => ({
      ...service,
      executable: createScriptExecutable(`PORT=${service.port} node ${service.script}`)
    }))

  for (const service of liveServices) {
    if (argv.proxy && (!service.proxy_settings || JSON.stringify(service.proxy_settings) === '{}')) {
      console.log(yellow(`${bold('Warning')}: no proxy_settings found for the ${service.configName} service.
  You will likely encounter errors at this endpoint if
  external requests do not include proper headers.`))
    }

    await runScript(service.dir, 'maya-pre-build', ctx.env)
      .catch(e => console.error('Trouble running maya-pre-build:', e))

    await service.executable()

    runWatcher(service, argv)
  }

  // Stop here without getting into proxy servers unless `--proxy` or `--skip-deploy` were supplied
  if (!argv.proxy) return tearDownListeners()

  // Establish ngrok tunnel for public use
  const ngrokPort = (ctx.proxy_settings && ctx.proxy_settings.ngrokPort) || 5050

  const ngrokOptions = { addr: ngrokPort }

  if (ctx.proxy_settings && ctx.proxy_settings.authtoken && ctx.proxy_settings.subdomain) {
    ngrokOptions.authtoken = ctx.proxy_settings.authtoken
    ngrokOptions.subdomain = ctx.proxy_settings.subdomain
  }

  const url = await ngrok.connect(ngrokOptions).catch(err => err instanceof Error ? err : new Error(err))

  if (url instanceof Error) throw url

  setNgrokUrl(url)

  clipboardy.writeSync(url)
  console.log(green(`${italic(url)} --> copied to clipboard!`))
  console.log('Inspect this connection in your browser at http://127.0.0.1:4040\n')

  // Create proxy layer to adjust headers
  const proxy = httpProxy.createProxyServer({})

  proxy.on('error', (err, req, res) => onProxyError(err, true))

  // create base server to receive the ngrok tunnel and forward request through the proxy to
  // each specific backend service (running with nodemon)
  const server = http.createServer((req, res) => {
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-credentials', '*')
    res.setHeader('access-control-allow-headers', '*')
    res.setHeader('access-control-allow-methods', '*')

    if (req.method === 'OPTIONS') {
      res.statusCode = 200
      res.write('OK')

      return res.end()
    }
    const urlServicePath = urlModule.parse(req.url).pathname.split('/').slice(3, 5).join('/')

    for (const service of liveServices) {
      if (urlServicePath === service.namespaceRoute) {
        const headerKeys = ['x-firebase-url', 'x-firebase-secret', 'x-plugin', 'x-plugin-draft', 'x-zengine-webhook-key']

        if (accessToken) {
          req.headers['authorization'] = `Bearer ${accessToken}`
        }

        headerKeys.forEach(key => {
          if (service.proxy_settings && service.proxy_settings[key]) {
            req.headers[key] = service.proxy_settings[key]
          }
        })

        return proxy.web(req, res, { target: `http://localhost:${service.port}` })
      }
    }

    res.statusCode = 404
    res.write('Plugin service url not found. Double check your maya.json configuration\'s namespaces, routes, etc.')

    return res.end()
  })

  server.listen(ngrokPort)

  return tearDownListeners(true)

  /**
   * Some cleanup sanity, like ensuring a clean exit with ctrl+C and `.exit` in the terminal
   * Also threw in a minor perk: reload a service by typing the name in the terminal
   *
   * @param {boolean} proxyServers are there servers that need to be closed?
   */
  function tearDownListeners (proxyServers) {
    process.stdin.on('data', buffer => {
      const text = buffer.toString().trim()

      if (text === '.exit') return process.emit('cleanup')

      const [wu, wi] = text.split(' ')

      if ((wu === 'wu' || wu === 'webhook-update') && wi) {
        if (!argv.proxy) {
          return console.error(red('You must run mayan with `--proxy` to use this feature.'))
        }

        const webhookId = Number(wi)

        return updateWebhookUrl({ id: webhookId, ngrokUrl: url, ctx })
      }

      if ((wu === 'swu' || wu === 'scheduled-webhook-update') && wi) {
        if (!argv.proxy) {
          return console.error(red('You must run mayan with `--proxy` to use this feature.'))
        }

        const webhookId = Number(wi)

        return updateWebhookUrl({ scheduled: true, id: webhookId, ngrokUrl: url, ctx })
      }

      let executed = false
      liveServices.forEach(srv => {
        if (text === srv.configName) {
          srv.executable()
          executed = true
        }
      })

      if (!executed) {
        return console.log(`command not recognized: \`${text}\``)
      }
    })

    // we really just need to use StandardJS without modification to avoid stupid stuff like this
    const cleanup = async () => { // eslint-disable-line
      process.stdout.clearLine() // clears ^C
      process.stdout.cursorTo(0)
      console.log('closing connections...')

      if (proxyServers) {
        proxy.close()
        server.close()
        await ngrok.kill().catch(console.error)
      }

      for (const service of liveServices) {
        const dead = await service.executable(true).catch(console.error)
        console.log(italic(red(`${service.configName} is ${dead}.`)))
      }

      console.log(italic(yellow('Bye bye.')))

      return process.exit(0)
    }

    process.once('cleanup', cleanup)
    process.on('SIGINT', () => process.emit('cleanup'))
    process.on('SIGTERM', () => process.emit('cleanup'))
    process.on('uncaughtException', error => {
      printErrorAndAbort('An Uncaught Exception occurred:')(error)
      process.emit('cleanup')
    })
    process.on('unhandledRejection', error => {
      printErrorAndAbort('An Unhandled Rejection occurred:')(error)
      process.emit('cleanup')
    })
    process.on('exit', code => code > 0 && process.emit('cleanup'))
  }
}
