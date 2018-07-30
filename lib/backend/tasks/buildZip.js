'use strict'

const zipFolder = require('zip-folder')

const buildZip = dest => {
  return new Promise((resolve, reject) => {
    zipFolder(dest, `${dest}/dist.zip`, function(err) {
      if(err) {
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports = buildZip
