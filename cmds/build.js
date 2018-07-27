'use strict'

const build = require('../lib/build')

exports.command = 'build [plugin]'

exports.desc = 'Build plugin'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('frontend', {
    describe: 'Whether to only build frontend plugins',
    type: 'boolean',
    default: false
  })
  yargs.option('backend', {
    describe: 'Whether to only build backend services',
    type: 'boolean',
    default: false
  })
}

exports.handler = build
