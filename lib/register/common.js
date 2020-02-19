'use strict'

const format = require('util').format
const request = require('request-promise')

exports.authorizedRequest = (ctx, id, data, method = 'POST') => {
  const url = format(
    'https://%s/v1/plugins/%d',
    ctx.apiEndpoint || null,
    id
  )

  const accessToken = ctx.accessToken || null

  const options = {
    url,
    method,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
    json: true,
    body: data
  }

  return request(options)
}
