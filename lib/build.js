'use strict'

const context = require('./context')
const buildBackend = require('./backend/build')
const buildFrontend = require('./frontend/build')

function createBuild(argv) {
  return context(argv).then(buildBackend).then(buildFrontend)
}

module.exports = createBuild
