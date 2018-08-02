'use strict'

const fs = require('fs')
const execa = require('execa')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

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
    mkdirp.sync(tempPath)

    // Support legacy frontend modules package.json location.
    if (fs.existsSync(`${src}/src/package.json`)) {
      fs.copyFileSync(`${src}/src/package.json`, `${tempPath}/package.json`)
    } else if (fs.existsSync(`${src}/package.json`)) {
      // Also support new default location.
      fs.copyFileSync(`${src}/package.json`, `${tempPath}/package.json`)
    } else {
      // Nothing to do here, we have no package.json file to install.
      return Promise.resolve()
    }

    // Install package.json in production mode.
    return execa('npm', ['install', '--production'], { cwd: tempPath })
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
