const watchFrontend = require('./frontend/watch')

module.exports = (argv) => {
  if (argv.frontend || (!argv.frontend && !argv.backend)) {
    watchFrontend({ ...argv, frontend: true, backend: false })
  }
}
