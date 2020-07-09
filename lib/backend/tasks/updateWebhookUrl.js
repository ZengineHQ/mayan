const request = require('request-promise')
const { URL } = require('url')

module.exports = async (id, ngrokUrl, ctx = {}) => {
  const {
    apiEndpoint,
    accessToken
  } = ctx

  // 1. GET existing webhook url
  const res = await request.get(`https://${apiEndpoint}/v1/webhooks/${id}`, {
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .catch(err => err instanceof Error ? err : new Error(JSON.stringify(err)))

  const { data: { url } = {} } = res || {}

  if (res instanceof Error || typeof url !== 'string') {
    return console.error(`Unable to GET webhook ${id}`, res)
  }

  // 2. strip out origin and replace with ngrokUrl
  const { origin } = buildURL(url)

  if (!origin) {
    return console.error('Unable to update webhook')
  }

  let parts = url.split(origin)

  if (parts.length > 2) {
    parts = ['', parts.slice(1).join(origin)]
  }

  const updatedUrl = parts.join(ngrokUrl)

  // 3. PUT new webhook url
  const updateResponse = await request.put(`https://${apiEndpoint}/v1/webhooks/${id}`, {
    json: true,
    body: {
      url: updatedUrl
    },
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .catch(err => err instanceof Error ? err : new Error(JSON.stringify(err)))

  if (updateResponse instanceof Error) {
    return console.error(`Unable to update webhook url: ${updateResponse}`)
  }

  const { data: { url: newUrl } = {} } = updateResponse || {}

  return console.log(`Successfully updated webhook url to:\n${newUrl}`)
}

function buildURL (url) {
  try {
    return new URL(url)
  } catch (e) {
    console.error(`"${url}" is not a valid url: ${e}`)

    return {}
  }
}
