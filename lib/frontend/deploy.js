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
const ERROR_DEPLOY_FAILED = 'Failed to deploy frontend plugin: %s (code: %d)'

function error(e) {
  return Promise.reject(new Error(e))
}

function createDeploy(ctx) {
  let deployFrontend = (frontend) => {
    console.log(kleur.blue(format('Deploying frontend %s/%d', frontend.configName, frontend.id)))

    if (!fs.existsSync(format(CSS_FILE_PATH, frontend.configName))) {
      return error(format(ERROR_FILE_NOT_FOUND, 'CSS', frontend.configName))
    }

    if (!fs.existsSync(format(JS_FILE_PATH, frontend.configName))) {
      return error(format(ERROR_FILE_NOT_FOUND, 'JS', frontend.configName))
    }

    if (!fs.existsSync(format(HTML_FILE_PATH, frontend.configName))) {
      return error(format(ERROR_FILE_NOT_FOUND, 'HTML', frontend.configName))
    }

    let data = {
      draftCss: fs.readFileSync(format(CSS_FILE_PATH, frontend.configName), 'utf-8'),
      draftJs: fs.readFileSync(format(JS_FILE_PATH, frontend.configName), 'utf-8'),
      draftHtml: fs.readFileSync(format(HTML_FILE_PATH, frontend.configName), 'utf-8')
    }

    let url = format(
      'https://%s/v1/plugins/%d',
      ctx.environments[ctx.env].api_endpoint || null,
      frontend.id
    )

    let accessToken = ctx.environments[ctx.env].access_token || null

    let options = {
      url: url,
      method: 'PUT',
      headers: {
        authorization: 'Bearer ' + accessToken
      },
      json: true,
      body: data
    }

    let onError = (error) => {
      return error(format(ERROR_DEPLOY_FAILED, error.error.userMessage, error.error.code))
    }

    return request(options).catch(onError)
  }

  let deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployFrontend, { concurrency: ctx.concurrency })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
