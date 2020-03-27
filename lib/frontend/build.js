'use strict'

// Build frontend plugins
const { format } = require('util')
const { spawn } = require('child_process')
const path = require('path')
const Promise = require('bluebird')
const kleur = require('kleur')
const Listr = require('listr')

const buildModules = require('./tasks/buildModules')
const buildJs = require('./tasks/buildJs')
const buildCss = require('./tasks/buildCss')
const buildHtml = require('./tasks/buildHtml')
const buildDependencies = require('./tasks/buildDependencies')
const buildZip = require('../backend/tasks/buildZip')
const { runScript, printError } = require('../util')

const onBuildError = printError('building frontend')

function createBuild (ctx, argv) {
  const buildFrontend = frontend => {
    console.log(kleur.blue(format('\r\nBuilding frontend %s/%d', frontend.configName, frontend.id)))

    if (frontend.version === 2) {
      return new Promise((resolve, reject) => {
        console.log('Building app...')

        const env = ctx.env
        const envMatch = env && env.match(/^[A-Za-z0-9\-_]*$/)

        if (!envMatch) {
          return reject(new Error('environment key contains forbidden characters'))
        }

        const name = frontend.configName
        const nameMatch = name && name.match(/^[A-Za-z0-9\-_]*$/)

        if (!nameMatch) {
          return reject(new Error('plugin name contains forbidden characters'))
        }

        const spawnedProcess = spawn('npm', ['run', 'build'], {
          cwd: path.resolve(`./plugins/${name}`),
          env: {
            ...process.env,
            ...frontend.env || {},
            ZENGINE_ENV: env
          },
          shell: true,
          stdio: ['ignore', 'inherit', 'inherit']
        })

        spawnedProcess.on('error', error => reject(error))

        spawnedProcess.on('close', result => resolve(result))
      })
        .then(() => {
          console.log('Creating archive...')

          return buildZip(path.resolve(process.cwd(), 'plugins', frontend.configName), 'dist')
        })
        .then(() => console.log(kleur.green('Done')))
        .catch(onBuildError)
    } else {
      const src = process.cwd() + `/plugins/${frontend.configName}`
      const dest = `${process.cwd()}/maya_build/plugins/${frontend.configName}`
      const temp = `${process.cwd()}/maya_build/temp/plugins/${frontend.configName}`
      const tempPkg = `${process.cwd()}/maya_build/temp/plugins/${frontend.configName}-package.json`
      const prodMode = (ctx.env === 'prod' || ctx.env === 'production') && !argv['skip-minify']
      const useCache = argv.cache

      return new Listr([
        {
          title: 'Running pre-build scripts',
          task: (c, task) => runScript(src, 'maya-pre-build', ctx.env).then(res => {
            task.output = res
          })
        },
        {
          title: 'Installing node_modules',
          task: () => buildModules(src, temp, tempPkg, useCache)
        },
        {
          title: 'Copying dependencies',
          task: () => buildDependencies(src, temp)
        },
        {
          title: 'Building Javascript files',
          task: () => buildJs(src, temp, dest, frontend, prodMode)
        },
        {
          title: 'Building SCSS/CSS files',
          task: () => buildCss(src, temp, dest, frontend, prodMode)
        },
        {
          title: 'Building HTML files',
          task: () => buildHtml(src, temp, dest, frontend, prodMode)
        },
        {
          title: 'Running post-build scripts',
          task: (c, task) => runScript(dest, 'maya-post-build', ctx.env).then(res => {
            task.output = res
          })
        }
      ]).run().then(() => console.log(kleur.green('Done')))
    }
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: 1 })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
