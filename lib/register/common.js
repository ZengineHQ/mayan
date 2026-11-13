'use strict'

const format = require('util').format

exports.authorizedRequest = async (ctx, id, data, method = 'POST') => {
  const url = format(
    'https://%s/v1/plugins/%d',
    ctx.apiEndpoint || null,
    id
  )

  const accessToken = ctx.accessToken || null

  const response = await fetch(url, {
    method,
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(format('%d - %s', response.status, await response.text()))
  }

  return response.json()
}
