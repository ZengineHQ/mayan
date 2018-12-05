'use strict'

const build = require('../lib/build')

exports.command = ['build [plugin]', 'b']

exports.desc = 'Build plugin'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('frontend', {
    describe: 'Only build frontend plugins',
    alias: 'f',
    type: 'boolean',
    default: false
  })
  yargs.option('backend', {
    describe: 'Only build backend services',
    alias: 'b',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-minify', {
    describe: 'Skip minifying files when a production environment is detected',
    alias: 'sm',
    type: 'boolean',
    default: false
  })
  yargs.option('cache', {
    describe: 'Use cached node_modules to avoid npm installing',
    alias: 'c',
    type: 'boolean',
    default: false
  })
}

exports.handler = build
