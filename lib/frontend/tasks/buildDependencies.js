'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')
const ncp = require('ncp')

const getModulesPath = require('./buildModules').getModulesPath

/**
 * Builds dependencies.
 *
 * @param src string The source directory.
 *
 * @returns {Promise<any>}
 */
const buildDependencies = src => {
  const dest = getModulesPath(src)
  const path = `${src}/dependencies`

  if (fs.existsSync(path)) {
    const depsfile = fs.readFileSync(path)
    const deps = depsfile.toString().split('\n').filter(n => n)

    if (!deps.length) {
      return Promise.resolve()
    }

    const promises = []

    deps.forEach(dep => promises.push(copyDependency(src, dep, dest)))

    return Promise.all(promises)
  }
}

const copyDependency = (name, dest) => {
  const src = process.cwd() + `/plugins/common`
  const path = `${src}/${name}`

  if (!fs.existsSync(path)) {
    return Promise.resolve()
  }

  mkdirp.sync(dest)

  return new Promise((resolve, reject) => {
    return ncp(path, dest, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports = buildDependencies
