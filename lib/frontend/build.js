'use strict'

// Build frontend plugins
const format = require('util').format
const Promise = require('bluebird')

function createBuild(ctx) {

  let buildFrontend = function(frontend) {
    console.log(format('Building frontend %s/%d', frontend.configName, frontend.id))
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true)
      }, 2000)
    })
  }

  let buildEachPlugin = function() {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: ctx.concurrency })
  }

  return buildEachPlugin().return(ctx)

}

module.exports = createBuild
