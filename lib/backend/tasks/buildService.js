'use strict'

const fs = require('fs')
const execa = require('execa')
const rimraf = require('rimraf')
const ncp = require('ncp').ncp
const zipFolder = require('zip-folder')

exports.buildService = (src, dest, env) => {
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
    const promises = []
    const dirs = ['_runner', 'lib', 'src']

    dirs.forEach(dir => {
      promises.push(new Promise((resolve, reject) => {
        let target = `${src}/${dir}`

        if (fs.existsSync(target)) {
          return ncp(target, `${dest}/${dir}`, err => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        }

        resolve()
      }))
    })

    return Promise.all(promises)
  })
}

exports.installModules = dest => {
  console.log('dest', dest)
  return execa('npm', ['install', '--production'], { cwd: dest })
}

exports.makeZip = dest => {
  return new Promise((resolve, reject) => {
    zipFolder(dest, `${dest}/dist.zip`, function(err) {
      if(err) {
        return reject(err)
      }
      resolve()
    })
  })
}
