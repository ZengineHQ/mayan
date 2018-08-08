'use strict'

// Methods for working with the Zengine API to maintain plugins.
// NOTE: This code is not working as-is.

const slugify = require('../lib/util').slugify()
const baseUrl = ''

var homedir = require('os').homedir();
var cfg = require(homedir + '/.maya/mayarc.json');
var token = cfg.token;
var prefix = cfg.prefix;

module.exports.createService = (id, route, offline = false) => {
  return authorizedRequest(`${baseUrl}id/services`, { route: `/${route}`, offline })
}

module.exports.unpublishPlugin = id => {
  return authorizedRequest(`${baseUrl}id`, { publish: false })
}

const authorizedRequest = () => Promise.resolve()

module.exports.createPlugin = (config, answers) => {
  const namespace = slugify(config.prefix.toUpperCase() + answers.pluginName)

  const data = {
    namespace: namespace,
    privacy: 'private',
    name: answers.pluginName,
    description: `Dev version of the ${answers.pluginName} plugin`,
    supportUrl: 'http://wizehive.com',
    publish: false
  }

  if (answers.firebaseUrl && answers.firebaseSecret) {
    data.firebaseUrl = answers.firebaseUrl
    data.firebaseSecret = answers.firebaseSecret
  }

  return authorizedRequest(baseUrl, data).then(response => {
    return {
      id: response.data.id,
      route: response.data.route,
      namespace: response.data.namespace
    }
  }).catch(err => {
    // @TODO handle gracefully.
    console.log(err)
  }).then(data => {
    // Create backend service if we need one.
    if (answers.backendService) {
      return module.exports.createService(data.id, answers.backendService, answers.backendServiceOffline).then(response => {
        data.serviceId = response.data.id

        return data
      })
    }

    return data
  })
}
