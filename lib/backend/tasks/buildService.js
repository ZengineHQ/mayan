'use strict'

const fs = require('fs')
const { exec } = require('child_process')
const rimraf = require('rimraf')

const buildService = (src, dest, plugin, prod = false) => {
  return new Promise((resolve, reject) => {
    // First clear the directory.
    if (fs.existsSync(dest)) {
      return rimraf(dest, err => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    }
    resolve()
  }).then(() => {
    // Re-create directory.
    fs.mkdirSync(dest)

    // Copy files into our build directory.
    fs.copyFileSync(`${src}/package.json`, `${dest}/package.json`)
    fs.copyFileSync(`${src}/plugin.js`, `${dest}/plugin.js`)

    // Copy folders into our build directory.
    

    // Install package.json in production mode.
    return new Promise((resolve, reject) => {
      exec(`npm install --production`, { cwd: dest }, (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        resolve(stdout)
      })
    })
  })
}

exports = buildService
