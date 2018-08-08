'use strict'

// Deploy backend services
const format = require('util').format
const request = require('request-promise')
const Promise = require('bluebird')
const fs = require('fs')
const kleur = require('kleur')

const DIST_FILE_PATH = process.cwd() + '/maya_build/backend/%s/dist.zip'

const ERROR_FILE_NOT_FOUND = 'File %s not found, aborting deployment for backend plugin %s'

function error(e) {
  return Promise.reject(new Error(e))
}

function createDeploy(ctx) {
  const deployPlugin = (plugin) => {
    const deployBackend = (backend) => {
      console.log(kleur.blue(format('\r\nDeploying backend %s/%d', backend.configName, backend.id)))

      const distFilePath = format(DIST_FILE_PATH, backend.configName)

      if (!fs.existsSync(distFilePath)) {
        return error(format(ERROR_FILE_NOT_FOUND, 'DIST', backend.configName))
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

      const accessToken = ctx.environments[ctx.env].access_token || null

      const options = {
        url: url,
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + accessToken
        },
        formData: data
      }

      return request(options).then(() => console.log(kleur.green('Done')))
    }

    return Promise.map(plugin.services, deployBackend, { concurrency: 1 })
  }

  const deployEachPlugin = () => {
    return Promise.map(ctx.plugins, deployPlugin, { concurrency: 1 })
  }

  return deployEachPlugin().return(ctx)
}

module.exports = createDeploy
