'use strict'

const deploy = require('../lib/deploy')

exports.command = 'deploy [plugin]'

exports.desc = 'Deploy plugin'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('frontend', {
    describe: 'Only deploy frontend plugins',
    type: 'boolean',
    default: false
  })
  yargs.option('backend', {
    describe: 'Only deploy backend services',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-build', {
    describe: 'Skip building and attempt to deploy plugins directly',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-minify', {
    describe: 'Skip minifying files when a production environment is detected',
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
