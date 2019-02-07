const http = require('http')
const ngrok = require('ngrok')
const httpProxy = require('http-proxy')

const getContext = require('../context')

const NGROK_PORT = 5050
const NGROK_HOST = '0.0.0.0'

module.exports = argv => {
  getContext(argv).then(ctx => console.log(JSON.stringify(ctx, null, 2)))

  return
  const proxy = httpProxy.createProxyServer({})

  proxy.on('proxyReq', (proxyReq, req, res, options) => {
    const headers = [
      'firebase-url',
      'firebase-secret',
      'plugin',
      'access-token'
    ]

    headers.forEach(header => {
      if (argv[header]) {
        let headerName = 'x-' + header
        let headerValue = argv[header]

        if (header === 'access-token') {
          headerName = 'authorization'
          headerValue = 'Bearer ' + argv.accessToken
        }

        proxyReq.setHeader(headerName, headerValue)
      }
    })
  })

  proxy.on('error', (err, req, res) => {
    console.log(err)
  })

  ngrok.once('connect', url => {
    console.log('ngrok accepting connections on ' + url)
    console.log('inspect connections on http://0.0.0.0:4040')
  })

  ngrok.once('disconnect', () => {
    console.log('ngrok disconnected')
  })

  ngrok.once('error', error => {
    console.log(error)
  })

  const options = { addr: NGROK_HOST + ':' + NGROK_PORT }

  if (argv.authtoken) {
    options.authtoken = argv.authtoken
  }

  if (argv.subdomain) {
    options.subdomain = argv.subdomain
  }

  ngrok.connect(options)

  const server = http.createServer((req, res) => {
    proxy.web(req, res, { target: argv.backendUrl })
  })

  server.listen(5050)
}
