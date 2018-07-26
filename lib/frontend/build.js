'use strict'

// Build frontend plugins
const format = require('util').format
const Promise = require('bluebird')

const TARGET_PATH = process.cwd() + '/maya_build/plugins'
const buildModules = require('./tasks/buildModules');
const buildJs = require('./tasks/buildJs');
const buildCss = require('./tasks/buildCss');
const buildHtml = require('./tasks/buildHtml');

function createBuild(ctx) {
  const buildFrontend = frontend => {
    console.log(format('Building frontend %s/%d', frontend.configName, frontend.id))

    const src = process.cwd() + `/plugins/${frontend.configName}`
    const tasks = []
    const prodMode = false; // @TODO infer from args or env

    return buildModules(src).then(() => {
      tasks.push(buildJs(src, TARGET_PATH, frontend, prodMode))
      tasks.push(buildCss(src, TARGET_PATH, frontend, prodMode))
      tasks.push(buildHtml(src, TARGET_PATH, frontend, prodMode))

      // @TODO exec npm maya_post_build script?

      return Promise.all(tasks).then(() => {
        console.log('we done homie!');
      });
    })
  }

  const buildEachPlugin = () => {
    return Promise.map(ctx.plugins, buildFrontend, { concurrency: ctx.concurrency })
  }

  return buildEachPlugin().return(ctx)
}

module.exports = createBuild
