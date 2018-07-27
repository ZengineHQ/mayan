'use strict'

// Build frontend plugins
const format = require('util').format
const Promise = require('bluebird')
const kleur = require('kleur')

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

    return runScript(src, 'maya-pre-build', ctx.env).then(() => {
      // Build node_modules first because they will be included into the other build steps.
      return buildModules(src);
    }).then(() => {
      const tasks = []

      tasks.push(buildJs(src, targetPath, frontend, prodMode))
      tasks.push(buildCss(src, targetPath, frontend, prodMode))
      tasks.push(buildHtml(src, targetPath, frontend, prodMode))

      return Promise.all(tasks).then(() => {
        return cleanupModules(src)
      }).then(() => runScript(src, 'maya-post-build', ctx.env)).then(() => console.log(kleur.green('Done')))
    })
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: ctx.concurrency })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
