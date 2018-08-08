'use strict'

const fs = require('fs')
const archiver = require('archiver')

const buildZip = (path, name) => {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip')
    let output = fs.createWriteStream(`${path}/${name}.zip`)

    output.on('close', () => {
      resolve()
    })

    archive.on('error', err => {
      reject(err)
    })

    archive.pipe(output)
    archive.directory(`${path}/${name}`, false)
    archive.finalize()
  })
}

module.exports = buildZip
