'use strict'

const fs = require('fs')
const { basename, extname } = require('path')

const MIME_TYPES = {
  '.zip': 'application/zip',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json'
}

/**
 * Error thrown for non-2xx responses. Shaped like request-promise's StatusCodeError so
 * existing handlers can keep reading `statusCode`, `response.body` and `response.toJSON()`.
 */
class StatusCodeError extends Error {
  constructor (statusCode, body, headers, url) {
    super(`${statusCode} - ${typeof body === 'string' ? body : JSON.stringify(body)}`)

    this.name = 'StatusCodeError'
    this.statusCode = statusCode
    this.response = {
      statusCode,
      body,
      headers,
      request: { url },
      toJSON () {
        return { statusCode, body, headers, url }
      }
    }
  }
}

/**
 * Turn a request-style `formData` object into a WHATWG FormData.
 * Values may be fs.ReadStream (as the deploy tasks pass), Blob, Buffer or string.
 */
const buildFormData = async formData => {
  const form = new FormData()

  for (const [field, value] of Object.entries(formData)) {
    if (value instanceof fs.ReadStream) {
      const filePath = String(value.path)

      // We only needed the path; don't leave the original descriptor open.
      value.destroy()

      const type = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'

      form.append(field, await fs.openAsBlob(filePath, { type }), basename(filePath))
    } else if (value instanceof Blob) {
      form.append(field, value)
    } else if (Buffer.isBuffer(value)) {
      form.append(field, new Blob([value]))
    } else {
      form.append(field, String(value))
    }
  }

  return form
}

/**
 * Minimal replacement for request-promise built on Node's global fetch.
 *
 * Supported options: url, method, headers, json, body, formData.
 * - `json: true` serialises `body` as JSON and parses the response body.
 * - `formData` sends multipart/form-data.
 * - Non-2xx responses reject with a StatusCodeError.
 *
 * @param {Object} options
 * @returns {Promise<any>} The response body, parsed when `json` is set or the response is JSON.
 */
const request = async ({ url, method = 'GET', headers = {}, json = false, body, formData } = {}) => {
  const init = { method: method.toUpperCase(), headers: { ...headers } }

  if (formData) {
    init.body = await buildFormData(formData)
  } else if (body !== undefined) {
    if (json && typeof body !== 'string') {
      init.headers['content-type'] = 'application/json'
      init.body = JSON.stringify(body)
    } else {
      init.body = body
    }
  }

  if (json) {
    init.headers.accept = 'application/json'
  }

  const response = await fetch(url, init)
  const text = await response.text()
  const isJsonResponse = (response.headers.get('content-type') || '').includes('application/json')

  let parsed = text

  if (json || isJsonResponse) {
    try {
      parsed = text === '' ? undefined : JSON.parse(text)
    } catch (e) {
      parsed = text
    }
  }

  if (!response.ok) {
    throw new StatusCodeError(response.status, parsed, Object.fromEntries(response.headers), url)
  }

  return parsed
}

for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
  request[method] = (url, options = {}) => request({ ...options, url, method })
}

request.StatusCodeError = StatusCodeError

module.exports = request
