'use strict'

const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const request = require('../lib/http')

// A tiny local server that echoes back what it received so we can assert on the wire format.
const startServer = () => new Promise(resolve => {
  const server = http.createServer((req, res) => {
    const chunks = []

    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      const body = Buffer.concat(chunks)

      if (req.url === '/text') {
        res.setHeader('content-type', 'text/plain')

        return res.end('{"status":200,"data":{"deployStatus":"completed"}}')
      }

      if (req.url === '/error') {
        res.statusCode = 401
        res.setHeader('content-type', 'application/json')

        return res.end(JSON.stringify({ code: 401, message: 'nope' }))
      }

      if (req.url === '/error-text') {
        res.statusCode = 500

        return res.end('server exploded')
      }

      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({
        method: req.method,
        headers: req.headers,
        body: body.toString('latin1')
      }))
    })
  })

  server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }))
})

describe('lib/http', () => {
  let server
  let base

  before(async () => {
    ({ server, base } = await startServer())
  })

  after(() => {
    server.close()
  })

  it('sends and parses JSON when json: true', async () => {
    const res = await request({
      url: `${base}/json`,
      method: 'PUT',
      json: true,
      headers: { authorization: 'Bearer abc' },
      body: { publish: true, name: 'x' }
    })

    expect(res.method).to.equal('PUT')
    expect(res.headers.authorization).to.equal('Bearer abc')
    expect(res.headers['content-type']).to.equal('application/json')
    expect(res.headers.accept).to.equal('application/json')
    expect(JSON.parse(res.body)).to.deep.equal({ publish: true, name: 'x' })
  })

  it('returns the raw text when the response is not JSON and json is not set', async () => {
    const res = await request({ url: `${base}/text`, method: 'GET' })

    expect(res).to.be.a('string')
    expect(JSON.parse(res).data.deployStatus).to.equal('completed')
  })

  it('exposes get/put shorthands like request-promise', async () => {
    const res = await request.get(`${base}/x`, { json: true })

    expect(res.method).to.equal('GET')

    const put = await request.put(`${base}/x`, { json: true, body: { a: 1 } })

    expect(put.method).to.equal('PUT')
    expect(JSON.parse(put.body)).to.deep.equal({ a: 1 })
  })

  it('uploads a read stream as a multipart file field', async () => {
    const file = path.join(os.tmpdir(), `mayan-http-spec-${process.pid}.zip`)

    fs.writeFileSync(file, 'PK-fake-zip-bytes')

    try {
      const res = await request({
        url: `${base}/upload`,
        method: 'POST',
        headers: { authorization: 'Bearer abc' },
        formData: { draftSource: fs.createReadStream(file) }
      })

      expect(res.method).to.equal('POST')
      expect(res.headers['content-type']).to.match(/^multipart\/form-data; boundary=/)
      expect(res.body).to.include(`name="draftSource"; filename="${path.basename(file)}"`)
      expect(res.body).to.include('Content-Type: application/zip')
      expect(res.body).to.include('PK-fake-zip-bytes')
    } finally {
      fs.unlinkSync(file)
    }
  })

  it('rejects non-2xx with a StatusCodeError carrying the parsed body', async () => {
    const err = await request({ url: `${base}/error`, json: true }).then(() => null, e => e)

    expect(err).to.be.an.instanceOf(request.StatusCodeError)
    expect(err.statusCode).to.equal(401)
    expect(err.response.body).to.deep.equal({ code: 401, message: 'nope' })
    expect(err.response.toJSON().statusCode).to.equal(401)
  })

  it('keeps a non-JSON error body as text', async () => {
    const err = await request({ url: `${base}/error-text` }).then(() => null, e => e)

    expect(err.statusCode).to.equal(500)
    expect(err.response.body).to.equal('server exploded')
    expect(err.message).to.include('server exploded')
  })
})
