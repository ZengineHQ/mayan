'use strict'

//  Deploy frontend plugins
const { format } = require('util')
const path = require('path')
const Promise = require('bluebird')
const fs = require('fs')
const { blue, green, yellow, red } = require('kleur')
const { get } = require('lodash')

const { sleep, printErrorAndAbort, safeJSONParse } = require('../util')

const NAMESPACED_PATH = process.cwd() + '/maya_build/plugins'

const CSS_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.css'
const JS_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.js'
const HTML_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.html'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for frontend plugin %s'

function error (e) {
  return Promise.reject(new Error(e))
}

/**
 * Build an Error for a non-2xx API response, carrying the status code and the
 * (JSON-parsed when possible) response body so the error handler can inspect them.
 */
async function apiError (response) {
  const text = await response.text()

  let body = text

  try {
    body = JSON.parse(text)
  } catch (e) {}

  return Object.assign(new Error(format('%d - %s', response.status, text)), {
    statusCode: response.status,
    body
  })
}

function createDeploy (ctx) {
  const deployFrontend = async frontend => {
    console.log(blue(format('\r\nDeploying frontend %s/%d', frontend.configName, frontend.id)))

    const accessToken = ctx.accessToken || null
    const authorization = 'Bearer ' + accessToken

    const onResponse = res => {
      console.log(green('Done'))
    }

    const recursivelyCheckDeployment = async () => {
      const url = format(
        'https://%s/v1/plugins/%d',
        ctx.apiEndpoint,
        frontend.id
      )

      const response = await fetch(url, { headers: { authorization } })

      if (!response.ok) {
        throw await apiError(response)
      }

      const res = safeJSONParse(await response.text())

      if (!res || res.status < 200 || 299 < res.status) { // eslint-disable-line
        throw new Error('unable to successfully fetch plugin deploy status:' + JSON.stringify(res))
      }

      if (res.data && res.data.deployStatus === 'completed') {
        return 'Deployed!'
      }

      if (res.data && (res.data.deployStatus === 'in-progress' || res.data.deployStatus === 'pending')) {
        console.log(yellow(`Deployment is ${res.data.deployStatus.split('-').join(' ')}`))

        await sleep(2500)

        return recursivelyCheckDeployment()
      }

      console.error(red('Something went wrong fetching the deploy status.'))
      console.info('Check your configuration details and try again.')

      throw new Error('Something went wrong fetching the deploy status.')
    }

    const onError = err => {
      const errorCode = get(err, 'body.code') || get(err, 'statusCode')

      let message

      switch (errorCode) {
        case 401:
          message = red(format(
            'Invalid or expired access token %s',
            accessToken
          ))
          break

        case 5004:
          message = red(format(
            'Frontend plugin not found, check your plugin configuration for %s (%s) ' +
            'in maya.json or if you have permissions to manage the plugin.',
            frontend.namespace,
            frontend.id
          ))
          break

        case 4013:
          message = red(format(
            'Unauthorized request, verify that you have permission to manage the plugin.'
          ))
          break

        default:
          message = format(
            '%s\n\n %s',
            red('Unknown error occurred, check the http response below'),
            get(err, 'body', err && err.message)
          )
      }

      console.log(message)
      printErrorAndAbort('deploying frontend')(err)
    }

    const rejectUnlessOk = async response => {
      if (!response.ok) {
        throw await apiError(response)
      }
    }

    if (frontend.version === 2) {
      const distFilePath = path.resolve(process.cwd(), `./plugins/${frontend.configName}/dist.zip`)

      if (!fs.existsSync(distFilePath)) {
        return error(format(ERROR_FILE_NOT_FOUND, 'dist.zip', frontend.configName))
      }

      const url = format(
        'https://%s/v1/plugins/%d/uploads',
        ctx.apiEndpoint,
        frontend.id
      )

      const body = new FormData()

      body.append(
        'draftSource',
        await fs.openAsBlob(distFilePath, { type: 'application/zip' }),
        path.basename(distFilePath)
      )

      return fetch(url, { method: 'POST', headers: { authorization }, body })
        .then(rejectUnlessOk)
        .then(() => recursivelyCheckDeployment())
        .then(onResponse)
        .catch(onError)
    } else {
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
        ctx.apiEndpoint,
        frontend.id
      )

      return fetch(url, {
        method: 'PUT',
        headers: {
          authorization,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(rejectUnlessOk)
        .then(onResponse)
        .catch(onError)
    }
  }

  const deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployFrontend, { concurrency: 1 })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
