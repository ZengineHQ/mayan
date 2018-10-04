'use strict'

const fs = require('fs')
const execa = require('execa')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

const copyDir = require('../../util').copyDir

/**
 * Builds node modules.
 *
 * @param src string The source directory.
 * @param dest string The destination directory.
 *
 * @returns {Promise<any>}
 */
const buildModules = (src, dest) => {
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
    mkdirp.sync(dest)

    // Support legacy frontend modules package.json location.
    if (fs.existsSync(`${src}/src/package.json`)) {
      fs.copyFileSync(`${src}/src/package.json`, `${dest}/package.json`)
    } else if (fs.existsSync(`${src}/package.json`)) {
      // Also support new default location.
      fs.copyFileSync(`${src}/package.json`, `${dest}/package.json`)
    } else {
      // Nothing to do here, we have no package.json file to install.
      return Promise.resolve()
    }

    // Install package.json in production mode.
    return execa('npm', ['install', '--production'], { cwd: dest })
  }).then(() => {
    // Finally, let's make sure that we handle symlinked @zenginehq modules which we might have installed locally
    // when developing them.
    const prefix = 'node_modules/@zenginehq'
    const zdir = `${src}/${prefix}`

    if (fs.existsSync(zdir)) {
      // Check each top-level directory to find symlinks.
      const promises = []

      fs.readdirSync(zdir).forEach(dir => {
        let path = `${zdir}/${dir}`

        if (fs.lstatSync(path).isSymbolicLink()) {
          promises.push(copyDir(`${fs.realpathSync(path)}/src`, `${dest}/${prefix}/${dir}`))
        }
      })

      return Promise.all(promises)
    }

    return Promise.resolve()
  })
}

module.exports = buildModules
