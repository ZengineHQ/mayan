'use strict'

// Build frontend plugins
const format = require('util').format
const Promise = require('bluebird')

function createBuild(ctx) {
  const buildFrontend = frontend => {
    console.log(format('Building frontend %s/%d', frontend.configName, frontend.id))

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, 2000)
    })
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: ctx.concurrency })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
