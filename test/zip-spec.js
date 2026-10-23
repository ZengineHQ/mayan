'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const buildZip = require('../lib/backend/tasks/buildZip')

// A minimal reader for the archives the writer produces: walks the central directory and
// inflates each entry from its local header.
const readZip = file => {
  const data = fs.readFileSync(file)
  let end = data.length - 22

  while (data.readUInt32LE(end) !== 0x06054b50) {
    end--
  }

  const count = data.readUInt16LE(end + 10)
  let position = data.readUInt32LE(end + 16)
  const entries = []

  for (let i = 0; i < count; i++) {
    expect(data.readUInt32LE(position)).to.equal(0x02014b50)

    const method = data.readUInt16LE(position + 10)
    const crc = data.readUInt32LE(position + 16)
    const compressedSize = data.readUInt32LE(position + 20)
    const size = data.readUInt32LE(position + 24)
    const nameLength = data.readUInt16LE(position + 28)
    const extraLength = data.readUInt16LE(position + 30)
    const commentLength = data.readUInt16LE(position + 32)
    const mode = data.readUInt32LE(position + 38) >>> 16
    const offset = data.readUInt32LE(position + 42)
    const name = data.toString('utf8', position + 46, position + 46 + nameLength)

    expect(data.readUInt32LE(offset)).to.equal(0x04034b50)

    const dataStart = offset + 30 + data.readUInt16LE(offset + 26) + data.readUInt16LE(offset + 28)
    const raw = data.subarray(dataStart, dataStart + compressedSize)
    const contents = method === 8 ? zlib.inflateRawSync(raw) : raw

    expect(contents.length).to.equal(size)
    expect(zlib.crc32(contents)).to.equal(crc)

    entries.push({ name, method, mode, contents: contents.toString() })
    position += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

describe('backend/buildZip', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mayan-zip-'))
  })

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

  it('archives a directory tree with modes, links and empty directories kept', async () => {
    const dist = path.join(root, 'dist')

    fs.mkdirSync(path.join(dist, 'sub/deep'), { recursive: true })
    fs.mkdirSync(path.join(dist, 'empty'))
    fs.writeFileSync(path.join(dist, 'b.txt'), 'hello world, hello world, hello world')
    fs.writeFileSync(path.join(dist, 'a.sh'), '#!/bin/sh\n', { mode: 0o755 })
    fs.writeFileSync(path.join(dist, 'sub/deep/c.json'), '')
    fs.writeFileSync(path.join(dist, 'sub/ünï.js'), 'x')
    fs.symlinkSync('b.txt', path.join(dist, 'link'))

    await buildZip(root, 'dist')

    const entries = readZip(path.join(root, 'dist.zip'))

    expect(entries.map(entry => entry.name)).to.deep.equal([
      'a.sh', 'b.txt', 'empty/', 'link', 'sub/', 'sub/deep/', 'sub/deep/c.json', 'sub/ünï.js'
    ])
    expect(entries.map(entry => entry.method)).to.deep.equal([8, 8, 0, 0, 0, 0, 8, 8])
    expect(entries.find(entry => entry.name === 'b.txt').contents).to.equal('hello world, hello world, hello world')
    expect(entries.find(entry => entry.name === 'sub/deep/c.json').contents).to.equal('')
    expect(entries.find(entry => entry.name === 'link').contents).to.equal('b.txt')
    expect(entries.find(entry => entry.name === 'a.sh').mode & 0o777).to.equal(0o755)
    expect(entries.find(entry => entry.name === 'empty/').mode & 0o170000).to.equal(0o040000)
    expect(entries.find(entry => entry.name === 'link').mode & 0o170000).to.equal(0o120000)
  })

  it('rejects and leaves no archive when the directory is missing', async () => {
    await expect(buildZip(root, 'nope')).to.be.rejectedWith(/ENOENT/)

    expect(fs.existsSync(path.join(root, 'nope.zip'))).to.equal(false)
  })
})
