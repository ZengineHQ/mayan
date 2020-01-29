'use strict'

//  Deploy frontend plugins
const { format } = require('util')
const path = require('path')
const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const kleur = require('kleur')
const { get } = require('lodash')
const jsome = require('jsome')

const { sleep } = require('../util')

const NAMESPACED_PATH = process.cwd() + '/maya_build/plugins'

const CSS_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.css'
const JS_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.js'
const HTML_FILE_PATH = NAMESPACED_PATH + '/%s/plugin.html'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for frontend plugin %s'

function error(e) {
  return Promise.reject(new Error(e))
}

function createDeploy(ctx) {
  const deployFrontend = frontend => {
    console.log(kleur.blue(format('\r\nDeploying frontend %s/%d', frontend.configName, frontend.id)))

    const accessToken = ctx.environments[ctx.env].access_token || null

    const onResponse = res => {
      console.log(kleur.green('Done'))
    }

    const recursivelyCheckDeployment = async () => { // eslint-disable-line
      const url = format(
        'https://%s/v1/plugins/%d',
        ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com',
        frontend.id
      )

      const unparsed = await request({
        url,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      }).catch(err => err instanceof Error ? err : new Error(JSON.stringify(err)))

      if (unparsed instanceof Error) {
        throw new Error(unparsed)
      }

      const res = JSON.parse(unparsed)

      if (res.status < 200 || 299 < res.status) { // eslint-disable-line
        throw new Error('unable to successfully fetch plugin deploy status:' + JSON.stringify(res))
      }

      if (res.data && res.data.deployStatus === 'completed') {
        return 'Deployed!'
      }

      if (res.data && (res.data.deployStatus === 'in-progress' || res.data.deployStatus === 'pending')) {
        console.log(kleur.yellow(`Deployment is ${res.data.deployStatus.split('-').join(' ')}`))

        await sleep(2500)

        return recursivelyCheckDeployment()
      }

      console.error(kleur.red('Something went wrong fetching the deploy status.'))
      console.info('Check your configuration details and try again.')
    }

    const onError = (err) => {
      const errorResponse = err && err.response && err.response && typeof err.response.toJSON === 'function' && err.response.toJSON()
      const errorCode = get(err, 'response.body.code') || get(err, 'statusCode')

      let message

      switch (errorCode) {
        case 401:
          message = kleur.red(format(
            'Invalid or expired access token %s',
            accessToken
          ))
          break

        case 5004:
          message = kleur.red(format(
            'Frontend plugin not found, check your plugin configuration for %s (%s) ' +
            'in maya.json or if you have permissions to manage the plugin.',
            frontend.namespace,
            frontend.id
          ))
          break

        default:
          message = format(
            '%s\n\n %s',
            kleur.red('Unknown error occurred, check the http response below'),
            jsome.getColoredString(errorResponse)
          )
      }

      console.log(message)
    }

    if (frontend.version === 2) {
      const distFilePath = path.resolve(process.cwd(), `./plugins/${frontend.configName}/dist.zip`)

      if (!fs.existsSync(distFilePath)) {
        return error(format(ERROR_FILE_NOT_FOUND, 'dist.zip', frontend.configName))
      }

      const url = format(
        'https://%s/v1/plugins/%d/uploads',
        ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com',
        frontend.id
      )

      const formData = {
        draftSource: fs.createReadStream(distFilePath)
      }

      const options = {
        url,
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + accessToken
        },
        formData
      }

      return request(options)
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
        ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com',
        frontend.id
      )

      const options = {
        url: url,
        method: 'PUT',
        headers: {
          authorization: 'Bearer ' + accessToken
        },
        json: true,
        body: data
      }

      return request(options).then(onResponse).catch(onError)
    }
  }

  const deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployFrontend, { concurrency: 1 })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
