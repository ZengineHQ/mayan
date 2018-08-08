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
 * Builds node modules.
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
  }).then(() => {
    // Finally, let's make sure that we handle symlinked @zenginehq modules which we might have installed locally
    // when developing them.
    const prefix = 'node_modules/@zenginehq'
    const zdir = `${src}/${prefix}`

    if (fs.existsSync(zdir)) {
      // Check each top-level directory to find symlinks.
      const promises = []

      fs.readdirSync(zdir).forEach(dir => {
        if (fs.lstatSync(`${zdir}/${dir}`).isSymbolicLink()) {
          let dest = `${tempPath}/${prefix}/${dir}`
          promises.push(copySymlinkedDir(`${zdir}/${dir}`, dest))
        }
      })

      return Promise.all(promises)
    }

    return Promise.resolve()
  })
}

const copySymlinkedDir = (src, dest) => {
  const realPath = `${fs.realpathSync(src)}/src`
  return copyDir(realPath, dest)
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
