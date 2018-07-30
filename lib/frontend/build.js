'use strict'

// Build frontend plugins
const format = require('util').format
const Promise = require('bluebird')
const kleur = require('kleur')
const Listr = require('listr')

const targetPath = process.cwd() + '/maya_build/plugins'
const { buildModules, cleanupModules } = require('./tasks/buildModules')
const buildJs = require('./tasks/buildJs')
const buildCss = require('./tasks/buildCss')
const buildHtml = require('./tasks/buildHtml')
const runScript = require('../util').runScript

function createBuild(ctx) {
  const buildFrontend = frontend => {
    console.log(kleur.blue(format('Building frontend %s/%d', frontend.configName, frontend.id)))

    const src = process.cwd() + `/plugins/${frontend.configName}`
    const prodMode = ctx.env === 'prod' || ctx.env === 'production'

    return new Listr([
      {
        title: 'Running pre-build scripts',
        task: () => runScript(src, 'maya-pre-build', ctx.env)
      },
      {
        title: 'Installing node_modules',
        task: () => buildModules(src)
      },
      {
        title: 'Building Javascript files',
        task: () => buildJs(src, targetPath, frontend, prodMode)
      },
      {
        title: 'Building SCSS/CSS files',
        task: () => buildCss(src, targetPath, frontend, prodMode)
      },
      {
        title: 'Building HTML files',
        task: () => buildHtml(src, targetPath, frontend, prodMode)
      },
      {
        title: 'Cleaning up',
        task: () => cleanupModules(src)
      },
      {
        title: 'Running post-build scripts',
        task: () => runScript(src, 'maya-post-build', ctx.env)
      }
    ]).run().then(() => console.log(kleur.green('Done')))
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: ctx.concurrency })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
