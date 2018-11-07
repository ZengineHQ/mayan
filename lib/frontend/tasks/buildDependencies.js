'use strict'

const fs = require('fs')
const rimraf = require('rimraf')

const copyDir = require('../../util').copyDir

/**
 * Builds dependencies.
 *
 * @param src string The source directory.
 * @param dest string The source directory.
 *
 * @returns {Promise<any>}
 */
const buildDependencies = (src, dest) => {
  const destPath = `${dest}/common`
  const sourcePath = `${src}/dependencies`

  return new Promise((resolve, reject) => fs.existsSync(destPath) ? rimraf(destPath, err => err ? reject(err) : resolve()) : resolve())
    .then(() => {
      if (fs.existsSync(sourcePath)) {
        const depsfile = fs.readFileSync(sourcePath)
        const deps = depsfile.toString().split('\n').filter(n => n).sort().reverse()

        if (!deps.length) {
          return Promise.resolve()
        }

        const promises = []

        deps.forEach(dep => promises.push(copyDependency(dep, destPath)))

        return Promise.all(promises)
      }
    })
}

const copyDependency = (name, dest) => {
  const src = process.cwd() + `/plugins/common`
  const path = `${src}/${name}/src`

  if (!fs.existsSync(path)) {
    return Promise.resolve()
  }

  return copyDir(path, `${dest}/${name}`)
}

module.exports = buildDependencies
