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
const runSequential = require('./util').runSequential

function publish(ctx) {
  const publishOne = (plugin) => {
    console.log(format('Publishing %s/%d', plugin.configName, plugin.id))

    const url = format(
      'https://%s/v1/plugins/%d',
      ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com',
      plugin.id
    )

    const accessToken = ctx.environments[ctx.env].access_token || null

    const data = { publish: true }

    if (ctx.name) {
      data.name = ctx.name
    }

    if (ctx.description) {
      data.description = ctx.description
    }

    if (ctx.supportUrl) {
      data.supportUrl = ctx.supportUrl
    }

    if (ctx.privacy) {
      data.privacy = ctx.privacy
    }

    if (ctx.visible) {
      data.visible = ctx.visible
    }

    if (ctx.firebaseUrl) {
      data.firebaseUrl = ctx.firebaseUrl
    }

    if (ctx.firebaseSecret) {
      data.firebaseSecret = ctx.firebaseSecret
    }

    const options = {
      url: url,
      method: 'PUT',
      headers: {
        authorization: 'Bearer ' + accessToken
      },
      json: true,
      body: data
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

  return Promise.map(ctx.plugins, publishOne, { concurrency: 1 })
}

function createPublish(argv) {
  return context(argv).then(ctx => {
    const promises = []

    if (argv.frontend || !argv.backend) {
      promises.push(buildFrontend)
    }

    if (argv.backend || !argv.frontend) {
      promises.push(buildBackend)
    }

    // This is a little verbose with this way we ensure both front and back get built before published.

    if (argv.frontend || !argv.backend) {
      promises.push(deployFrontend)
    }

    if (argv.backend || !argv.frontend) {
      promises.push(deployBackend)
    }

    // This one always happens.
    promises.push(publish)

    return runSequential(promises, ctx)
  })
}

module.exports = createPublish
