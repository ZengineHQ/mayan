'use strict'

const { context } = require('./context')
const buildBackend = require('./backend/build')
const buildFrontend = require('./frontend/build')
const runSequential = require('./util').runSequential
const kleur = require('kleur')

function createBuild (argv) {
  const onError = (err) => {
    console.log(kleur.red(err.message))
  }

  return context(argv)
    .then(ctx => {
      const promises = []

      if (argv.frontend || !argv.backend) {
        promises.push(buildFrontend)
      }

      if (argv.backend || !argv.frontend) {
        promises.push(buildBackend)
      }

      return runSequential(promises, ctx, argv)
    })
    .catch(onError)
}

module.exports = createBuild
