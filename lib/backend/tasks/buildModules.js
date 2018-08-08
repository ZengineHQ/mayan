'use strict'

const execa = require('execa')

const buildModules = dest => {
  return execa('npm', ['install', '--production'], { cwd: dest })
}

module.exports = buildModules
