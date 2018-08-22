'use strict'

const rimraf = require('rimraf')

const cleanup = path => {
  return new Promise((resolve, reject) => {
    return rimraf(path, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports = cleanup
