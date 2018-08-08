'use strict'

//  Deploy frontend plugins
const format = require('util').format
const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const kleur = require('kleur')

const NAMESPACED_PATH = process.cwd() + '/maya_build/plugins'

const CSS_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.css'
const JS_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.js'
const HTML_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.html'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for frontend plugin %s'

function error(e) {
  return Promise.reject(new Error(e))
}

function createDeploy(ctx) {
  const deployFrontend = (frontend) => {
    console.log(kleur.blue(format('\r\nDeploying frontend %s/%d', frontend.configName, frontend.id)))

    if (!fs.existsSync(format(JS_FILE_PATH, frontend.configName))) {
      return error(format(ERROR_FILE_NOT_FOUND, 'JS', frontend.configName))
    }

    if (!fs.existsSync(format(HTML_FILE_PATH, frontend.configName))) {
      return error(format(ERROR_FILE_NOT_FOUND, 'HTML', frontend.configName))
    }

    // Just create an empty CSS file if none exists, we can live without it.
    if (!fs.existsSync(format(CSS_FILE_PATH, frontend.configName))) {
      fs.writeFileSync(format(CSS_FILE_PATH, frontend.configName), '')
    }

    const data = {
      draftCss: fs.readFileSync(format(CSS_FILE_PATH, frontend.configName), 'utf-8'),
      draftJs: fs.readFileSync(format(JS_FILE_PATH, frontend.configName), 'utf-8'),
      draftHtml: fs.readFileSync(format(HTML_FILE_PATH, frontend.configName), 'utf-8')
    }

    const url = format(
      'https://%s/v1/plugins/%d',
      ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com',
      frontend.id
    )

    const accessToken = ctx.environments[ctx.env].access_token || null

    let options = {
      url: url,
      method: 'PUT',
      headers: {
        authorization: 'Bearer ' + accessToken
      },
      json: true,
      body: data
    }

    return request(options).then(() => console.log(kleur.green('Done')))
  }

  const deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployFrontend, { concurrency: 1 })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
