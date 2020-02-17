'use strict'

const request = require('request-promise')
const Promise = require('bluebird')
const kleur = require('kleur')
const format = require('util').format

const { context } = require('./context')
const buildBackend = require('./backend/build')
const buildFrontend = require('./frontend/build')
const deployBackend = require('./backend/deploy')
const deployFrontend = require('./frontend/deploy')
const runSequential = require('./util').runSequential
const Confirm = require('prompt-confirm')

function publish (ctx, argv) {
  const apiEndpoint = ctx.environments[ctx.env].api_endpoint || 'api.zenginehq.com'

  const publishOne = plugin => {
    return new Promise((resolve, reject) => {
      if (argv.yes) {
        return resolve()
      }

      const prompt = new Confirm(format('\r\nPublish %s/%d to %s?', plugin.configName, plugin.id, apiEndpoint))

      return prompt.run().then(answer => {
        if (!answer) {
          return reject(answer)
        }
        resolve()
      })
    }).then(() => {
      console.log(kleur.blue(format('\r\nPublishing %s/%d', plugin.configName, plugin.id)))

      const url = format(
        'https://%s/v1/plugins/%d',
        apiEndpoint,
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

      return request(options).then(() => console.log(kleur.green('Done'))).catch(error => {
        // todo: for now print error but might be better to return reject msg
        console.error(format(
          'Failed to publish plugin: %s (code: %d)',
          error.error.userMessage,
          error.error.code
        ))
      })
    }).catch(() => {})
  }

  return Promise.map(ctx.plugins, publishOne, { concurrency: 1 })
}

function createPublish (argv) {
  let onError = (err) => {
    console.log(kleur.red(err.message))
  }

  return context(argv).then(ctx => {
    const promises = []

    // Allow the build process to be skipped.
    if (!argv['skip-build']) {
      if (argv.frontend || !argv.backend) {
        promises.push(buildFrontend)
      }

      if (argv.backend || !argv.frontend) {
        promises.push(buildBackend)
      }
    }

    // Allow the deploy process to be skipped.
    if (!argv['skip-deploy']) {
      if (argv.frontend || !argv.backend) {
        promises.push(deployFrontend)
      }

      if (argv.backend || !argv.frontend) {
        promises.push(deployBackend)
      }
    }

    // This one always happens.
    promises.push(publish)

    return runSequential(promises, ctx, argv)
  }).catch(onError)
}

module.exports = createPublish
