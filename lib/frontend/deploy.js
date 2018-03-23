'use strict'

//  Deploy frontend plugins
const format = require('util').format
const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')

const NAMESPACED_PATH = './maya_build/namespaced/'

const CSS_FILE_PATH = NAMESPACED_PATH + '%s/plugin.css'
const JS_FILE_PATH = NAMESPACED_PATH + '%s/plugin.js'
const HTML_FILE_PATH = NAMESPACED_PATH + '%s/plugin.html'

const ERROR_FILE_NOT_FOUND = 'Error: could not find %s file, aborting deployment for plugin %s'

function createDeploy(ctx) {
  let deployFrontend = (plugin) => {
    console.log(format('Deploying frontend %s/%d', plugin.configName, plugin.id))

    if (!fs.existsSync(format(CSS_FILE_PATH, plugin.configName))) {
      return Promise.reject(new Error(
        format(ERROR_FILE_NOT_FOUND, 'CSS', plugin.configName)
      ))
    }

    if (!fs.existsSync(format(JS_FILE_PATH, plugin.configName))) {
      return Promise.reject(new Error(
        format(ERROR_FILE_NOT_FOUND, 'JS', plugin.configName)
      ))
    }

    if (!fs.existsSync(format(HTML_FILE_PATH, plugin.configName))) {
      return Promise.reject(new Error(
        format(ERROR_FILE_NOT_FOUND, 'HTML', plugin.configName)
      ))
    }

    let data = {
      draftCss: fs.readFileSync(format(CSS_FILE_PATH, plugin.configName), 'utf-8'),
      draftJs: fs.readFileSync(format(JS_FILE_PATH, plugin.configName), 'utf-8'),
      draftHtml: fs.readFileSync(format(HTML_FILE_PATH, plugin.configName), 'utf-8')
    }

    let url = format(
      'https://%s/v1/plugins/%d',
      ctx.environments[ctx.env].api_endpoint || null,
      plugin.id
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
      console.error(format(
        'Failed to deploy plugin: %s (code: %d)',
        error.error.userMessage,
        error.error.code
      ))
    }

    return request(options).catch(onError)
  }

  let deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployFrontend, { concurrency: ctx.concurrency })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
