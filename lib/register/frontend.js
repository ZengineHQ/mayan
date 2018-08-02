'use strict'

module.exports = ctx => {
  const id = ctx.plugins[0].id
  return Promise.resolve();
  // return authorizedRequest(ctx, id, { publish: true }, 'PUT')
}
