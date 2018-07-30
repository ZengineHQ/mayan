'use strict'

// Build backend services
const format = require('util').format
const Promise = require('bluebird')
const kleur = require('kleur')
const Listr = require('listr')

const targetPath = process.cwd() + '/maya_build/backend'
const { buildService, installModules, makeZip } = require('./tasks/buildService')
const runScript = require('../util').runScript

function createBuild(ctx) {
  const buildBackend = (backend) => {
    console.log(kleur.blue(format('Building backend %s/%d', backend.configName, backend.id)))

    const src = process.cwd() + `/backend/${backend.configName}`

    return new Listr([
      {
        title: 'Running pre-build scripts',
        task: () => runScript(src, 'maya-pre-build', ctx.env)
      },
      {
        title: 'Copying files',
        task: () => buildService(src, targetPath, ctx.env)
      },
      {
        title: 'Installing node_modules',
        task: () => installModules(targetPath)
      },
      {
        title: 'Creating archive',
        task: () => makeZip(targetPath)
      },
      {
        // Support legacy script name.
        title: 'Running post-build scripts',
        task: () => runScript(src, 'maya-post-build', ctx.env) && runScript(src, 'maya-build', ctx.env)
      }
    ]).run().then(() => console.log(kleur.green('Done')))
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
