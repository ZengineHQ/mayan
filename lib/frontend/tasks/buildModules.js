'use strict'

const fs = require('fs')
const { exec } = require('child_process')
const rimraf = require('rimraf')

/**
 * Returns the path to store node modules temporarily.
 *
 * @param src string The source directory.
 *
 * @returns {string}
 */
exports.getModulesPath = src => `${src}/build`

/**
 * Populates the node modules directory.
 *
 * @param src string The source directory.
 *
 * @returns {Promise<any>}
 */
exports.buildModules = src => {
  const tempPath = exports.getModulesPath(src)

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

    // Support legacy frontend modules package.json location.
    if (fs.existsSync(`${src}/src/package.json`)) {
      fs.copyFileSync(`${src}/src/package.json`, `${tempPath}/package.json`)
    } else {
      // Fallback to default/new location.
      fs.copyFileSync(`${src}/package.json`, `${tempPath}/package.json`)
    }

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

/**
 * Cleanup the temporary node modules directory.
 *
 * @param src string The source directory.
 *
 * @returns {Promise<any>}
 */
exports.cleanupModules = src => {
  const tempPath = exports.getModulesPath(src)

  return new Promise((resolve, reject) => {
    return rimraf(tempPath, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}
