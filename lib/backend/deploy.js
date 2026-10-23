'use strict'

// Deploy backend services
const format = require('util').format
const path = require('path')
const Promise = require('bluebird')
const fs = require('fs')
const { blue, green, red } = require('kleur')
const get = require('lodash').get
const { printErrorAndAbort } = require('../util')

const DIST_FILE_PATH = process.cwd() + '/maya_build/backend/%s.zip'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for backend plugin %s'

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
  const deployPlugin = (plugin) => {
    const deployBackend = async (backend) => {
      console.log(blue(format('\r\nDeploying backend %s/%d', backend.configName, backend.id)))

      const distFilePath = format(DIST_FILE_PATH, backend.configName)

      if (!fs.existsSync(distFilePath)) {
        return error(format(ERROR_FILE_NOT_FOUND, 'DIST', backend.configName))
      }

      const accessToken = ctx.accessToken || null

      const onResponse = (res) => {
        console.log(green('Done'))
      }

      const onError = (err) => {
        const errParsed = get(err, 'body')
        const errorCode = get(errParsed, 'code') || get(err, 'statusCode')

        let message

        switch (errorCode) {
          case 401:
            message = red(format(
              'Invalid or expired access token %s',
              accessToken
            ))
            break

          case 4012:
            message = red(format(
              'Validation errors: \n%s',
              get(errParsed, 'validationErrors.draftSource[0]') || get(errParsed, 'validationErrors')
            ))
            break

          case 5004:
            message = red(format(
              'Backend plugin not found, check your plugin configuration for %s (%s) ' +
              'in maya.json or if you have permissions to manage the plugin.',
              backend.namespace,
              backend.id
            ))
            break

          default:
            message = red(format('An unknown error occurred'))
        }

        console.log(message)
        printErrorAndAbort('deploying backend')(err)
      }

      const url = format(
        'https://%s/v1/plugins/%d/services/%d/uploads',
        ctx.apiEndpoint,
        plugin.id,
        backend.id
      )

      const body = new FormData()

      body.append(
        'draftSource',
        await fs.openAsBlob(distFilePath, { type: 'application/zip' }),
        path.basename(distFilePath)
      )

      return fetch(url, {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + accessToken
        },
        body
      })
        .then(async response => {
          if (!response.ok) {
            throw await apiError(response)
          }
        })
        .then(onResponse)
        .catch(onError)
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
