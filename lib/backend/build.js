'use strict'

// Build backend services
const format = require('util').format
const Promise = require('bluebird')
const { green } = require('kleur')
const Listr = require('listr')

const buildService = require('./tasks/buildService')
const buildModules = require('./tasks/buildModules')
const buildZip = require('./tasks/buildZip')
const { checkNvm, checkNpmVersion } = require('../util')
const runScript = require('../util').runScript

const targetPath = process.cwd() + '/maya_build/backend'
const path = process.cwd();

function createBuild (ctx) {
  const buildBackend = async (backend) => {
    console.log(green(format('\r\nBuilding backend %s/%d', backend.configName, backend.id)))
    await checkNvm(path)
    await checkNpmVersion()
    const src = process.cwd() + `/backend/${backend.configName}`
    const dest = `${targetPath}/${backend.configName}`

    return new Listr([
      {
        title: 'Running pre-build scripts',
        task: (c, task) => runScript(src, 'maya-pre-build', ctx.env).then(res => {
          task.output = res
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
        title: 'Running post-build scripts',
        task: (c, task) => runScript(dest, 'maya-post-build', ctx.env).then(res => {
          task.output = res
        })
      },
      {
        title: 'Creating archive',
        task: () => buildZip(targetPath, backend.configName)
      }
    ]).run().then(() => console.log(green('Done')))
  }

  const buildPlugin = (plugin) => {
    return Promise.map(
      plugin.services
        .filter(service => ctx.services[0] === '*' || ctx.services.some(name => name === service.configName)),
      buildBackend,
      { concurrency: 1 }
    )
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildPlugin, { concurrency: 1 })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
