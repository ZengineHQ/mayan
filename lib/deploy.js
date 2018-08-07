'use strict'

const context = require('./context')
const buildBackend = require('./backend/build')
const buildFrontend = require('./frontend/build')
const deployBackend = require('./backend/deploy')
const deployFrontend = require('./frontend/deploy')
const runSequential = require('./util').runSequential

function createDeploy(argv) {
  return context(argv).then(ctx => {
    const promises = []

    if (argv.frontend || !argv.backend) {
      promises.push(buildFrontend)
    }

    if (argv.backend || !argv.frontend) {
      promises.push(buildBackend)
    }

    // This is a little verbose with this way we ensure both front and back get built before published.

    if (argv.frontend || !argv.backend) {
      promises.push(deployFrontend)
    }

    if (argv.backend || !argv.frontend) {
      promises.push(deployBackend)
    }

    return runSequential(promises, ctx)
  })
}

module.exports = createDeploy
