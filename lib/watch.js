const watchFrontend = require('./frontend/watch')
const watchBackend = require('./backend/watch')
const { runSequential } = require('./util')

module.exports = (argv) => {
  const promises = []

  if (argv.backend || (!argv.frontend && !argv.backend)) {
    promises.push(watchBackend)
  }

  if (argv.frontend || (!argv.frontend && !argv.backend)) {
    promises.push(watchFrontend)
  }

  runSequential(promises, argv)
}
