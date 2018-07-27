'use strict'

// Methods for working with the Zengine API to maintain plugins.

const slugify = require('../lib/util').slugify()
const baseUrl = 'https://api.zenginehq.com/v1/plugins/'

module.exports.createService = (id, route, offline = false) => {
  return authorizedRequest(`${baseUrl}id/services`, { route: `/${route}`, offline })
}

module.exports.publishPlugin = id => {
  return authorizedRequest (`${baseUrl}id`, { publish: true })
}

module.exports.unpublishPlugin = id => {
  return authorizedRequest (`${baseUrl}id`, { publish: false })
}

module.exports.authorizedRequest = (url, data) => {
  const options = { headers: { 'Authorization': 'Bearer ' + config.token } }
  return requestify.post(url, data, options).then(response => response.getbody())
}

module.exports.createPlugin = (config, answers) => {
  const namespace = slugify(config.prefix.toUpperCase() + answers.pluginName)

  const data = {
    namespace: namespace,
    privacy: 'private',
    name: answers.pluginName,
    description: `Dev version of the ${name} plugin`,
    supportUrl: 'http://wizehive.com',
    publish: false,
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
      return createService(data.id, answers.backendService, answers.backendServiceOffline).then(response => {
        data.serviceId = response.data.id
        return data
      })
    }
    return data
  }).then(data => {
    // Finally, publish the plugin.
    return publishPlugin(data.id).then(() => {
      return data
    })
  })
}
