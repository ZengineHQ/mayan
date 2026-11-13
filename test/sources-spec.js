'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const sources = require('../lib/frontend/sources')

const write = (file, content = '') => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

const collect = stream => new Promise((resolve, reject) => {
  const files = []

  stream.on('data', file => files.push(file)).on('end', () => resolve(files)).on('error', reject)
})

describe('frontend/sources', () => {
  let root

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mayan-sources-'))
  })

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

  describe('listFiles', () => {
    it('lists shallower files first, then by path segment in byte order', async () => {
      for (const file of ['b.js', 'a/z.js', 'a-b/x.js', 'a/c/d.js', 'Z.js', '_u.js', 'a-b.js', 'a_b.js', 'a.css', 'sub/n.js']) {
        write(path.join(root, file))
      }

      const files = await sources.listFiles(root, '.js')

      expect(files.map(file => path.relative(root, file))).to.deep.equal([
        'Z.js', '_u.js', 'a-b.js', 'a_b.js', 'b.js',
        'a/z.js', 'a-b/x.js', 'sub/n.js',
        'a/c/d.js'
      ])
    })

    it('ignores dot entries everywhere and skipped names only at the top level', async () => {
      for (const file of ['.hidden.js', '.git/x.js', 'node_modules/n.js', 'sub/node_modules/m.js', 'sub/.x.js', 'ok.js']) {
        write(path.join(root, file))
      }

      const files = await sources.listFiles(root, '.js', ['node_modules'])

      expect(files.map(file => path.relative(root, file))).to.deep.equal(['ok.js', 'sub/node_modules/m.js'])
    })

    it('follows symlinked directories and ignores broken links', async () => {
      write(path.join(root, 'target/deep/t.js'))
      fs.mkdirSync(path.join(root, 'tree'))
      fs.symlinkSync(path.join(root, 'target'), path.join(root, 'tree/linked'), 'dir')
      fs.symlinkSync(path.join(root, 'missing'), path.join(root, 'tree/broken'), 'dir')

      const files = await sources.listFiles(path.join(root, 'tree'), '.js')

      expect(files).to.deep.equal([path.join(root, 'tree/linked/deep/t.js')])
    })

    it('yields nothing for a missing directory', async () => {
      expect(await sources.listFiles(path.join(root, 'nope'), '.js')).to.deep.equal([])
    })
  })

  describe('sources', () => {
    it('streams groups in order, based on the group directory, with any BOM removed', async () => {
      write(path.join(root, 'a/sub/x.js'), 'x')
      write(path.join(root, 'b/y.js'), Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from('y')]))
      write(path.join(root, 'c.js'), 'c')

      const files = await collect(sources([
        { dir: path.join(root, 'a'), ext: '.js' },
        { file: path.join(root, 'c.js') },
        { dir: path.join(root, 'b'), ext: '.js' }
      ]))

      expect(files.map(file => file.relative)).to.deep.equal(['sub/x.js', 'c.js', 'y.js'])
      expect(files.map(file => file.contents.toString())).to.deep.equal(['x', 'c', 'y'])
      expect(files[0].stat.isFile()).to.equal(true)
    })

    it('rejects when a single file is missing', async () => {
      await expect(collect(sources([{ file: path.join(root, 'nope.js') }]))).to.be.rejectedWith(/File not found/)
    })
  })
})
