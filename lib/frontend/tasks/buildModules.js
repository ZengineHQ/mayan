'use strict'

const fs = require('fs')
const execa = require('execa')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

const copyDir = require('../../util').copyDir
const checkSum = require('../../util').checkSum

/**
 * Builds node modules.
 *
 * @param src string The source directory.
 * @param dest string The destination directory.
 *
 * @returns {Promise<any>}
 */
const buildModules = (src, dest, destPkg, useCache) => {
  // create and compare checksums
  const destExists = fs.existsSync(dest)
  const destPackageExists = fs.existsSync(destPkg)
  const srcLegacyPackageExists = fs.existsSync(`${src}/src/package.json`)
  const srcPackageExists = !srcLegacyPackageExists && fs.existsSync(`${src}/package.json`)

  const destCheckSum = destPackageExists && checkSum(fs.readFileSync(destPkg))
  const srcCheckSum = (srcPackageExists || srcLegacyPackageExists) &&
    checkSum(fs.readFileSync(srcPackageExists ? `${src}/package.json` : `${src}/src/package.json`))

  // caching process (or not) ultimately decided by the combination of these factors
  const willUseCache = useCache && destExists && destPackageExists && destCheckSum === srcCheckSum

  return new Promise((resolve, reject) => {
    return !willUseCache ? destExists ? rimraf(dest, err => err ? reject(err) : resolve()) : resolve() : resolve()
  }).then(() => {
    // if definitely using cache, then skip npm installation and any package.json copying
    if (willUseCache) {
      return Promise.resolve()
    }

    // If we got this far, then the dest directory was destroyed. Remake it. Duh.
    mkdirp.sync(dest)

    // Support legacy frontend modules package.json location.
    if (srcLegacyPackageExists) {
      fs.copyFileSync(`${src}/src/package.json`, `${dest}/package.json`)
      fs.copyFileSync(`${src}/src/package.json`, destPkg)
    } else if (srcPackageExists) {
      // Also support new default location.
      fs.copyFileSync(`${src}/package.json`, `${dest}/package.json`)
      fs.copyFileSync(`${src}/package.json`, destPkg)
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
