'use strict'

function createPublish(ctx) {
  const publishPlugin = plugin => {
    return authorizedRequest(ctx, plugin.id, { publish: true }, 'PUT')
  }

  const publishEachPlugin = () => {
    return Promise.map(ctx.plugins, publishPlugin, { concurrency: 1 })
  }

  return publishEachPlugin().return(ctx)
}

module.exports = createPublish
