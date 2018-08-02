'use strict'

const request = require('request-promise')

module.exports.authorizedRequest = (ctx, id, data, method = 'POST') => {
  const url = format(
    'https://%s/v1/plugins/%d',
    ctx.environments[ctx.env].api_endpoint || null,
    id
  )

  const accessToken = ctx.environments[ctx.env].access_token || null

  const options = {
    url: url,
    method,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
    json: true,
    body: data
  }

  return request(options)
}
