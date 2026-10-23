'use strict'

const path = require('path')
const { Readable } = require('stream')
const Vinyl = require('vinyl')
const concat = require('../lib/frontend/concat')

const file = (name, contents, mtime, base = '/base') => new Vinyl({
  cwd: '/',
  base,
  path: path.join(base, name),
  stat: { mtime: new Date(mtime), mode: 0o644 },
  contents: Buffer.from(contents)
})

const run = files => new Promise((resolve, reject) => {
  const out = []

  Readable.from(files).pipe(concat('plugin.js'))
    .on('data', joined => out.push(joined))
    .on('end', () => resolve(out))
    .on('error', reject)
})

describe('frontend/concat', () => {
  it('joins contents with a newline between files and none at the end', async () => {
    const out = await run([file('a.js', 'a', 1), file('b.js', 'b\n', 2), file('c.js', '', 3), file('d.js', 'd', 4)])

    expect(out).to.have.lengthOf(1)
    expect(out[0].contents.toString()).to.equal('a\nb\n\n\nd')
    expect(out[0].relative).to.equal('plugin.js')
  })

  it('keeps the input order', async () => {
    const out = await run([file('z.js', 'z', 9), file('a.js', 'a', 1)])

    expect(out[0].contents.toString()).to.equal('z\na')
  })

  it('takes stat and base from the most recently modified file', async () => {
    const out = await run([file('a.js', 'a', 5, '/one'), file('b.js', 'b', 9, '/two'), file('c.js', 'c', 1, '/three')])

    expect(out[0].stat.mtime).to.deep.equal(new Date(9))
    expect(out[0].base).to.equal('/two')
    expect(out[0].path).to.equal(path.join('/two', 'plugin.js'))
  })

  it('emits nothing when no files come through', async () => {
    expect(await run([])).to.deep.equal([])
  })

  it('throws without a file name', () => {
    expect(() => concat()).to.throw('Missing file name')
  })
})
