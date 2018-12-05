'use strict'

const publish = require('../lib/publish')

exports.command = ['publish [plugin]', 'p']

exports.desc = 'Publish plugin'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('name', {
    describe: 'Name',
    alias: 'n',
    type: 'string'
  })
  yargs.option('description', {
    describe: 'Description',
    alias: 'd',
    type: 'string'
  })
  yargs.option('support-url', {
    describe: 'Customer support URL',
    alias: 'su',
    type: 'string'
  })
  yargs.option('privacy', {
    describe: 'Determines who can install the plugin',
    alias: 'p',
    type: 'string',
    choices: ['public', 'private']
  })
  yargs.option('visible', {
    describe: 'Whether plugin is listed in the marketplace',
    alias: 'v',
    type: 'boolean'
  })
  yargs.option('firebase-url', {
    describe: 'Firebase URL without path ex: http://example.firebaseio.com/',
    alias: 'fu',
    type: 'string'
  })
  yargs.option('firebase-secret', {
    describe: 'Firebase Secret',
    alias: 'fs',
    type: 'string'
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
    describe: 'Skip building plugins',
    alias: 'sb',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-deploy', {
    describe: 'Skip deploying plugins and attempt to publish directly',
    alias: 'sd',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-minify', {
    describe: 'Skip minifying files when a production environment is detected',
    alias: 'sm',
    type: 'boolean',
    default: false
  })
  yargs.option('yes', {
    describe: 'Skip the "are you sure" confirmation',
    type: 'boolean',
    alias: 'y',
    default: false
  })
  yargs.option('cache', {
    describe: 'Use cached node_modules to avoid npm installing',
    alias: 'c',
    type: 'boolean',
    default: false
  })
}

exports.handler = publish
