'use strict'

const fs = require('fs')

const copyDir = require('../../util').copyDir

const buildService = (src, dest, env) => {
  // First clear the directory.
  return fs.promises.rm(dest, { recursive: true, force: true }).then(() => {
    // Re-create directory.
    fs.mkdirSync(dest, { recursive: true })

    // Copy files into our build directory.
    fs.copyFileSync(`${src}/package.json`, `${dest}/package.json`)
    fs.copyFileSync(`${src}/plugin.js`, `${dest}/plugin.js`)

    // Check if we have an environment-specific config file.
    // If not, see if we have `config.json` and copy that instead
    const srcConfig = `${src}/config.json`
    const envConfig = `${src}/config-${env}.json`
    const destConfig = `${dest}/config.json`
    if (fs.existsSync(envConfig)) {
      fs.copyFileSync(envConfig, destConfig)
    } else if (fs.existsSync(srcConfig)) {
      fs.copyFileSync(srcConfig, destConfig)
    }

    // Copy folders into our build directory.
    const promises = []
    const dirs = ['_runner', 'lib', 'src']

    dirs.forEach(dir => {
      const path = `${src}/${dir}`

      if (fs.existsSync(path)) {
        promises.push(copyDir(path, `${dest}/${dir}`))
      }
    })

    return Promise.all(promises)
  })
}

module.exports = buildService
