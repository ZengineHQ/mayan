'use strict'

// const _ = require('lodash')
const request = require('request-promise')
const format = require('util').format
const context = require('./context')
const buildBackend = require('./backend/build')
const buildFrontend = require('./frontend/build')
const deployBackend = require('./backend/deploy')
const deployFrontend = require('./frontend/deploy')
const Promise = require('bluebird')

function publish(ctx) {
  let publishOne = (plugin) => {
    console.log(format('Publishing %s/%d', plugin.configName, plugin.id))

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
      body: {
        publish: true
      }
    }

    let onError = (error) => {
      // todo: for now print error but might be better to return reject msg
      console.error(format(
        'Failed to publish plugin: %s (code: %d)',
        error.error.userMessage,
        error.error.code
      ))
    }

    return request(options).catch(onError)
  }

  return Promise.map(ctx.plugins, publishOne, { concurrency: ctx.concurrency })

}

function createPublish(argv) {
  return context(argv)
    .then(buildBackend)
    .then(buildFrontend)
    .then(deployBackend)
    .then(deployFrontend)
    .then(publish)
}

module.exports = createPublish
