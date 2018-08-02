'use strict'

// Build backend services
const format = require('util').format
const Promise = require('bluebird')
const kleur = require('kleur')
const Listr = require('listr')

const targetPath = process.cwd() + '/maya_build/backend'
const buildService = require('./tasks/buildService')
const buildModules = require('./tasks/buildModules')
const buildZip = require('./tasks/buildZip')
const runScript = require('../util').runScript

function createBuild(ctx) {
  const buildBackend = (backend) => {
    console.log(kleur.blue(format('\r\nBuilding backend %s/%d', backend.configName, backend.id)))

    const src = process.cwd() + `/backend/${backend.configName}`
    const dest = `${targetPath}/${backend.configName}`

    return new Listr([
      {
        title: 'Running pre-build scripts',
        task: () => runScript(src, 'maya-pre-build', ctx.env).then(res => {
          if (Array.isArray(res)) {
            res.forEach(r => console.log(kleur.bgGreen(r)))
          }
        })
      },
      {
        title: 'Copying files',
        task: () => buildService(src, dest, ctx.env)
      },
      {
        title: 'Installing node_modules',
        task: () => buildModules(dest)
      },
      {
        title: 'Creating archive',
        task: () => buildZip(targetPath, backend.configName)
      },
      {
        // Support legacy script name.
        title: 'Running post-build scripts',
        task: () => runScript(src, ['maya-post-build', 'maya-build'], ctx.env).then(res => {
          if (Array.isArray(res)) {
            res.forEach(r => console.log(kleur.bgGreen(r)))
          }
        })
      }
    ]).run().then(() => console.log(kleur.green('Done')))
  }

  const buildPlugin = (plugin) => {
    return Promise.map(plugin.services, buildBackend, { concurrency: 1 })
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildPlugin, { concurrency: 1 })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
