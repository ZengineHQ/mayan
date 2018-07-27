'use strict'

const context = require('./context')
const buildBackend = require('./backend/build')
const buildFrontend = require('./frontend/build')

function createBuild(argv) {
  return context(argv).then(ctx => {
    const promises = []

    if (argv.frontend || !argv.backend) {
      promises.push(buildFrontend)
    }

    if (argv.backend || !argv.frontend) {
      promises.push(buildBackend)
    }

    return runSequential(promises, ctx)
  })
}

function runSequential (arr, ctx) {
  return arr.reduce((promise, cb) => {
    return promise.then(() => cb(ctx)).catch(err => console.error(err))
  }, Promise.resolve())
}

module.exports = createBuild
