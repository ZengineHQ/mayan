const watchFrontend = require('./frontend/watch')
const watchBackend = require('./backend/watch')
const { runSequential } = require('./util')

module.exports = (argv) => {
  const promises = []

  if (argv.frontend || (!argv.frontend && !argv.backend)) {
    promises.push(watchFrontend)
  }

  if (argv.backend || (!argv.frontend && !argv.backend)) {
    promises.push(watchBackend)
  }

  runSequential(promises, argv)
}
