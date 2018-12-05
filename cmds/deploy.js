'use strict'

const deploy = require('../lib/deploy')

exports.command = ['deploy [plugin]', 'd']

exports.desc = 'Deploy plugin'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('frontend', {
    describe: 'Only deploy frontend plugins',
    alias: 'f',
    type: 'boolean',
    default: false
  })
  yargs.option('backend', {
    describe: 'Only deploy backend services',
    alias: 'b',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-build', {
    describe: 'Skip building and attempt to deploy plugins directly',
    alias: 'sb',
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

exports.handler = deploy
