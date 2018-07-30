'use strict'

// Deploy backend services
const format = require('util').format
const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const kleur = require('kleur')

const DIST_FILE_PATH = process.cwd() + '/maya_build/backend/%s/dist.zip'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for backend plugin %s'
const ERROR_DEPLOY_FAILED = 'Failed to deploy backend plugin: %s (code: %d)'

function error(e) {
  return Promise.reject(new Error(e))
}

function createDeploy(ctx) {
  let deployPlugin = (plugin) => {
    let deployBackend = (backend) => {
      console.log(kleur.blue(format('Deploying backend %s/%d', backend.configName, backend.id)))

      let distFilePath = format(DIST_FILE_PATH, backend.configName)

      if (!fs.existsSync(distFilePath)) {
        return error(format(ERROR_FILE_NOT_FOUND, 'DIST', backend.configName))
      }

      let data = {
        draftSource: fs.createReadStream(distFilePath)
      }

      let url = format(
        'https://%s/v1/plugins/%d/services/%d/uploads',
        ctx.environments[ctx.env].api_endpoint || null,
        plugin.id,
        backend.id
      )

      let accessToken = ctx.environments[ctx.env].access_token || null

      let options = {
        url: url,
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + accessToken
        },
        formData: data
      }

      return request(options).then(() => {
        console.log(kleur.green('Done') + "\r\n")
      }).catch(err => error(format(ERROR_DEPLOY_FAILED, err.error.userMessage, err.error.code)))
    }

    return Promise.map(plugin.services, deployBackend, { concurrency: ctx.concurrency })
  }

  let deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployPlugin, { concurrency: 1 })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
