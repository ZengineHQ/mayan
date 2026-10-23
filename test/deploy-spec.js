'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

const API = 'api.example.test'

// Replace global fetch with a stub that records each call as a Request (so the body can be
// read back the way a server would see it) and answers with whatever `respond` returns.
const stubFetch = respond => {
  const calls = []

  globalThis.fetch = async (url, init) => {
    const request = new Request(url, init)

    calls.push(request)

    return respond(request, calls.length)
  }

  return calls
}

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'content-type': 'application/json' },
  ...init
})

describe('deploy', () => {
  const realFetch = globalThis.fetch
  const realCwd = process.cwd()
  let projectDir
  let deployBackend
  let deployFrontend

  before(() => {
    // Both deploy modules resolve their build paths from process.cwd() at require time.
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mayan-deploy-spec-'))
    process.chdir(projectDir)

    deployBackend = require('../lib/backend/deploy')
    deployFrontend = require('../lib/frontend/deploy')
  })

  after(() => {
    process.chdir(realCwd)
    fs.rmSync(projectDir, { recursive: true, force: true })
  })

  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it('uploads the backend zip as a multipart file field', async () => {
    const dist = path.join(projectDir, 'maya_build/backend/svc.zip')

    fs.mkdirSync(path.dirname(dist), { recursive: true })
    fs.writeFileSync(dist, 'PK-fake-backend-zip')

    const calls = stubFetch(() => json({}))

    await deployBackend({
      apiEndpoint: API,
      accessToken: 'abc',
      services: ['*'],
      plugins: [{ id: 1, services: [{ id: 2, configName: 'svc', namespace: 'svc' }] }]
    })

    expect(calls).to.have.length(1)

    const [request] = calls

    expect(request.url).to.equal(`https://${API}/v1/plugins/1/services/2/uploads`)
    expect(request.method).to.equal('POST')
    expect(request.headers.get('authorization')).to.equal('Bearer abc')
    expect(request.headers.get('content-type')).to.match(/^multipart\/form-data; boundary=/)

    const file = (await request.formData()).get('draftSource')

    expect(file.name).to.equal('svc.zip')
    expect(file.type).to.equal('application/zip')
    expect(await file.text()).to.equal('PK-fake-backend-zip')
  })

  it('uploads a version 2 frontend dist.zip then polls the deploy status', async () => {
    const dist = path.join(projectDir, 'plugins/fe/dist.zip')

    fs.mkdirSync(path.dirname(dist), { recursive: true })
    fs.writeFileSync(dist, 'PK-fake-frontend-zip')

    const calls = stubFetch((request, n) => {
      if (n === 1) {
        return json({})
      }

      // The status endpoint answers as text/plain; the poller parses it itself.
      return new Response('{"status":200,"data":{"deployStatus":"completed"}}', {
        status: 200,
        headers: { 'content-type': 'text/plain' }
      })
    })

    await deployFrontend({
      apiEndpoint: API,
      accessToken: 'abc',
      plugins: [{ id: 3, configName: 'fe', namespace: 'fe', version: 2 }]
    })

    expect(calls).to.have.length(2)

    const [upload, poll] = calls

    expect(upload.url).to.equal(`https://${API}/v1/plugins/3/uploads`)
    expect(upload.method).to.equal('POST')
    expect(upload.headers.get('authorization')).to.equal('Bearer abc')
    expect(upload.headers.get('content-type')).to.match(/^multipart\/form-data; boundary=/)

    const file = (await upload.formData()).get('draftSource')

    expect(file.name).to.equal('dist.zip')
    expect(file.type).to.equal('application/zip')
    expect(await file.text()).to.equal('PK-fake-frontend-zip')

    expect(poll.url).to.equal(`https://${API}/v1/plugins/3`)
    expect(poll.method).to.equal('GET')
    expect(poll.headers.get('authorization')).to.equal('Bearer abc')
  })

  it('PUTs a version 1 frontend as JSON', async () => {
    const dir = path.join(projectDir, 'maya_build/plugins/fe1')

    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'plugin.js'), 'js!')
    fs.writeFileSync(path.join(dir, 'plugin.html'), '<p>html</p>')

    const calls = stubFetch(() => json({}))

    await deployFrontend({
      apiEndpoint: API,
      accessToken: 'abc',
      plugins: [{ id: 4, configName: 'fe1', namespace: 'fe1', version: 1 }]
    })

    expect(calls).to.have.length(1)

    const [request] = calls

    expect(request.url).to.equal(`https://${API}/v1/plugins/4`)
    expect(request.method).to.equal('PUT')
    expect(request.headers.get('authorization')).to.equal('Bearer abc')
    expect(request.headers.get('content-type')).to.equal('application/json')
    expect(await request.json()).to.deep.equal({ draftCss: '', draftJs: 'js!', draftHtml: '<p>html</p>' })
  })
})
