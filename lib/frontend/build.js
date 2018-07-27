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

function createBuild(ctx) {
  const buildFrontend = frontend => {
    console.log(kleur.blue(format('Building frontend %s/%d', frontend.configName, frontend.id)))

    const src = process.cwd() + `/plugins/${frontend.configName}`
    const tasks = []
    const prodMode = ctx.env === 'prod' || ctx.env === 'production'

    // @TODO maybe allow a pre_build script to run?

    // Build node_modules first because they will be included into the other build steps.
    return buildModules(src).then(() => {
      tasks.push(buildJs(src, targetPath, frontend, prodMode))
      tasks.push(buildCss(src, targetPath, frontend, prodMode))
      tasks.push(buildHtml(src, targetPath, frontend, prodMode))

      return Promise.all(tasks).then(() => {
        return cleanupModules(src)
      }).then(() => {
        // @TODO exec npm maya_post_build script?
        console.log(kleur.green('Done'))
      })
    })
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: ctx.concurrency })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
