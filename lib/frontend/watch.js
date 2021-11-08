const { spawn } = require('child_process')
const path = require('path')
const chokidar = require('chokidar')
const kleur = require('kleur')

const pipe = require('callbag-pipe')
const forEach = require('callbag-for-each')
const combine = require('callbag-combine')
const { debounce } = require('callbag-debounce')
const { fromNodeEvent, printErrorAndAbort, getNgrokUrl } = require('../util')
const { context } = require('../context')

const deploy = require('../deploy')

const onLegacyWatchError = printErrorAndAbort('legacy watch on change handler')
const onWatchError = printErrorAndAbort('v2 watch spawn')

module.exports = argv => context(argv).then(ctx => {
  if (ctx.plugin === '*') {
    const [legacy, v2] = ctx.plugins
      .reduce(([leg = [], v2 = []], p) => {
        if (p.version === 2) {
          v2.push(p)
        } else {
          leg.push(p)
        }

        return [[...leg], [...v2]]
      }, [])

    return Promise.all([
      ...legacy.map(p => legacyWatchAndDeploy(p.configName)),
      ...v2.map(p => watchV2(p.configName, ctx.env, p.env))
    ])
  } else {
    return ctx.plugins[0].version === 2
      ? watchV2(ctx.plugins[0].configName, ctx.env, ctx.plugins[0].env)
      : legacyWatchAndDeploy(ctx.plugins[0].configName)
  }

  function legacyWatchAndDeploy (name) {
    return new Promise((resolve, reject) => {
      let deploying = false
      let waiting = false

      const deploySuccess = ctx => {
        if (waiting) {
          waiting = false

          return deploy({ ...argv, frontend: true, backend: false, plugin: name }).then(deploySuccess)
        } else {
          deploying = waiting = false
        }
      }

      const changeHandler = paths => {
        if (deploying) {
          waiting = true
        } else if (paths.some(s => s !== 'initialize')) {
          deploying = true

          return deploy({ ...argv, frontend: true, backend: false, plugin: name })
            .then(deploySuccess)
            .catch(err => {
              deploying = waiting = false
              onLegacyWatchError(err)
            })
        }
      }

      const frontend = chokidar.watch([
        `./plugins/${name}/src/**/*`,
        `./plugins/${name}/plugin-register.js`,
        './maya.json'
      ], { ignored: ['./plugins/*/node_modules', './plugins/*/build'] })

      frontend.on('ready', () => {
        pipe(
          combine(
            fromNodeEvent(frontend, 'change'),
            fromNodeEvent(frontend, 'add'),
            fromNodeEvent(frontend, 'unlink')
          ),
          debounce(50),
          forEach(changeHandler)
        )

        if (argv.backend || (!argv.frontend && !argv.backend)) {
          process.on('SIGINT', () => {
            process.emit('cleanup', 0)
          })
        }

        console.log(kleur.bold.green('Ready to rock...'))
        resolve()
      })

      frontend.on('error', error => reject(error))
    })
  }

  async function watchV2 (name, env = '', envConfig = {}) {
    const envMatch = env.match(/^[A-Za-z0-9\-_]*$/)

    if (!envMatch) {
      return onWatchError('environment key contains forbidden characters')
    }

    const nameMatch = name.match(/^[A-Za-z0-9\-_]*$/)

    if (!nameMatch) {
      return onWatchError('plugin name contains forbidden characters')
    }

    const spawnedProcess = spawn('npm', ['start'], {
      cwd: path.resolve(`./plugins/${name}`),
      env: {
        ...process.env,
        ...envConfig,
        ZENGINE_ENV: env,
        NGROK_URL: getNgrokUrl()
      },
      shell: true,
      stdio: ['ignore', 'inherit', 'inherit']
    })

    spawnedProcess.on('disconnect', data => {
      spawnedProcess.kill()
    })

    spawnedProcess.on('error', error => {
      onWatchError(error)

      process.exit(1)
    })
  }
})
