'use strict'

// Deploy backend services
const format = require('util').format
const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const kleur = require('kleur')
const get = require('lodash').get

const DIST_FILE_PATH = process.cwd() + '/maya_build/backend/%s.zip'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for backend plugin %s'

function error (e) {
  return Promise.reject(new Error(e))
}

function createDeploy (ctx) {
  const deployPlugin = (plugin) => {
    const deployBackend = (backend) => {
      console.log(kleur.blue(format('\r\nDeploying backend %s/%d', backend.configName, backend.id)))

      const distFilePath = format(DIST_FILE_PATH, backend.configName)

      if (!fs.existsSync(distFilePath)) {
        return error(format(ERROR_FILE_NOT_FOUND, 'DIST', backend.configName))
      }

      let onResponse = (res) => {
        console.log(kleur.green('Done'))
      }

      let onError = (err) => {
        const errParsed = JSON.parse(get(err, 'response.body'))
        const errJson = err.response.toJSON()
        const errorCode = get(errParsed, 'code') || get(errJson, 'statusCode')

        let message

        switch (errorCode) {
          case 401:
            message = kleur.red(format(
              'Invalid or expired access token %s',
              accessToken
            ))
            break

          case 4012:
            message = kleur.red(format(
              'Validation errors: \n%s',
              get(errParsed, 'validationErrors.draftSource')[0] || get(errParsed, ('validationErrors'))
            ))
            break

          case 5004:
            message = kleur.red(format(
              'Backend plugin not found, check your plugin configuration for %s (%s) ' +
              'in maya.json or if you have permissions to manage the plugin.',
              backend.namespace,
              backend.id
            ))
            break

          default:
            message = kleur.red(format('An unknown error occurred'))
        }

        console.log(message)
      }

      const data = {
        draftSource: fs.createReadStream(distFilePath)
      }

      const url = format(
        'https://%s/v1/plugins/%d/services/%d/uploads',
        ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com',
        plugin.id,
        backend.id
      )

      const accessToken = ctx.accessToken || null

      const options = {
        url: url,
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + accessToken
        },
        formData: data
      }

      return request(options).then(onResponse).catch(onError)
    }

    return Promise.map(
      plugin.services
        .filter(service => ctx.services[0] === '*' || ctx.services.some(name => name === service.configName)),
      deployBackend,
      { concurrency: 1 }
    )
  }

  const deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployPlugin, { concurrency: 1 })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
