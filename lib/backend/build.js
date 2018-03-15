'use strict'

// Build backend services
const format = require('util').format
const Promise = require('bluebird')

function createBuild(ctx) {

  let buildBackend = function(backend) {
    console.log(format('Building backend %s/%d', backend.configName, backend.id))
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true)
      }, 2000)
    })
  }

  let buildPlugin = function(plugin) {
    return Promise.map(plugin.services, buildBackend, { concurrency: ctx.concurrency })
  }

  let buildEachPlugin = function() {
    return Promise.map(ctx.plugins, buildPlugin, { concurrency: 1 })
  }

  return buildEachPlugin().return(ctx)

}

module.exports = createBuild
