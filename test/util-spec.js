'use strict'

const { PassThrough } = require('stream')
const { confirm } = require('../lib/util')

// Drive the confirm prompt with a scripted answer over in-memory streams.
const ask = (answer, options = {}) => {
  const input = new PassThrough()
  const output = new PassThrough()
  const promise = confirm('Proceed?', { input, output, ...options })

  input.end(`${answer}\n`)

  return promise.then(result => ({ result, prompt: output.read().toString() }))
}

describe('util.confirm', () => {
  it('defaults to yes on an empty answer', async () => {
    const { result, prompt } = await ask('')

    expect(result).to.equal(true)
    expect(prompt).to.equal('Proceed? (Y/n) ')
  })

  it('honours a default of no on an empty answer', async () => {
    const { result, prompt } = await ask('', { defaultYes: false })

    expect(result).to.equal(false)
    expect(prompt).to.equal('Proceed? (y/N) ')
  })

  it('accepts y, yes and true in any case', async () => {
    for (const answer of ['y', 'Y', 'yes', 'YES', 'true', ' Yes ']) {
      expect((await ask(answer)).result, `answer "${answer}"`).to.equal(true)
    }
  })

  it('treats anything else as no', async () => {
    for (const answer of ['n', 'N', 'no', 'nope', 'yess', 'false', 'maybe']) {
      expect((await ask(answer)).result, `answer "${answer}"`).to.equal(false)
    }
  })
})

describe('util.copyDir', () => {
  const fs = require('fs')
  const os = require('os')
  const path = require('path')
  const { copyDir } = require('../lib/util')

  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mayan-copydir-'))
    fs.mkdirSync(path.join(root, 'src', 'nested'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'a.txt'), 'a')
    fs.writeFileSync(path.join(root, 'src', 'nested', 'b.txt'), 'b')
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('copies a directory tree into a new destination', async () => {
    await copyDir(path.join(root, 'src'), path.join(root, 'dest'))

    expect(fs.readFileSync(path.join(root, 'dest', 'a.txt'), 'utf8')).to.equal('a')
    expect(fs.readFileSync(path.join(root, 'dest', 'nested', 'b.txt'), 'utf8')).to.equal('b')
  })

  it('replaces an existing destination instead of merging into it', async () => {
    fs.mkdirSync(path.join(root, 'dest', 'stale'), { recursive: true })
    fs.writeFileSync(path.join(root, 'dest', 'stale', 'old.txt'), 'old')
    fs.writeFileSync(path.join(root, 'dest', 'a.txt'), 'outdated')

    await copyDir(path.join(root, 'src'), path.join(root, 'dest'))

    expect(fs.existsSync(path.join(root, 'dest', 'stale'))).to.equal(false)
    expect(fs.readFileSync(path.join(root, 'dest', 'a.txt'), 'utf8')).to.equal('a')
  })

  it('rejects when the source does not exist', async () => {
    await expect(copyDir(path.join(root, 'missing'), path.join(root, 'dest'))).to.be.rejected
  })
})
