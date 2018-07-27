'use strict'

// Build backend services
const format = require('util').format
const Promise = require('bluebird')
const kleur = require('kleur')

const targetPath = process.cwd() + '/maya_build/backend'
const buildService = require('./tasks/buildService')

function createBuild(ctx) {
  const buildBackend = (backend) => {
    console.log(kleur.blue(format('Building backend %s/%d', backend.configName, backend.id)))

    const src = process.cwd() + `/backend/${backend.configName}`
    // const prodMode = ctx.env === 'prod' || ctx.env === 'production'

    return buildService(src, targetPath, ctx.env).then(() => {
      console.log(kleur.green('Done'))
    })
  }

  const buildPlugin = (plugin) => {
    return Promise.map(plugin.services, buildBackend, { concurrency: ctx.concurrency })
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildPlugin, { concurrency: 1 })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
