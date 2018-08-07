'use strict'

function buildService(ctx) {
  const createService = service => {
    if (!service.id || typeof service.id !== 'number') {
      // return authorizedRequest(ctx, service.id, { publish: true }, 'PUT')
    }

    return Promise.resolve()
  }

  const createPluginServices = plugin => {
    if (plugin.services && plugin.services.length) {
      return Promise.map(plugin.services, createService, { concurrency: 1 })
    }

    return Promise.resolve()
  }

  const createEachPluginsServices = () => {
    return Promise.map(ctx.plugins, createPluginServices, { concurrency: 1 })
  }

  return createEachPluginsServices().return(ctx)
}

module.exports = buildService
