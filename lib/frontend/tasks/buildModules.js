'use strict'

const fs = require('fs')
const rimraf = require('rimraf')
const { exec } = require('child_process')

// Build node modules.
const buildModules = src => {
  const tempPath = `${src}/build`

  return new Promise((resolve, reject) => {
    // First clear the directory.
    if (fs.existsSync(tempPath)) {
      return rimraf(tempPath, err => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    }
    resolve()
  }).then(() => {
    // Re-create directory.
    fs.mkdirSync(tempPath)

    // Copy the package.json file into our build directory.
    fs.copyFileSync(`${src}/package.json`, `${tempPath}/package.json`)

    // Install package.json in production mode.
    return new Promise((resolve, reject) => {
      exec(`npm install --production`, { cwd: tempPath }, (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        resolve(stdout)
      })
    })
  })
}

module.exports = buildModules
