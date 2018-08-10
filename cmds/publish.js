'use strict'

const publish = require('../lib/publish')

exports.command = 'publish [plugin]'

exports.desc = 'Publish plugin'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('name', {
    describe: 'Name',
    type: 'string'
  })
  yargs.option('description', {
    describe: 'Description',
    type: 'string'
  })
  yargs.option('support-url', {
    describe: 'Customer support URL',
    type: 'string'
  })
  yargs.option('privacy', {
    describe: 'Determines who can install the plugin',
    type: 'string',
    choices: ['public', 'private']
  })
  yargs.option('visible', {
    describe: 'Whether plugin is listed in the marketplace',
    type: 'boolean'
  })
  yargs.option('firebase-url', {
    describe: 'Firebase URL without path ex: http://example.firebaseio.com/',
    type: 'string'
  })
  yargs.option('firebase-secret', {
    describe: 'Firebase Secret',
    type: 'string'
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
    describe: 'Skip building plugins',
    type: 'boolean',
    default: false
  })
  yargs.option('skip-deploy', {
    describe: 'Skip deploying plugins and attempt to publish directly',
    type: 'boolean',
    default: false
  })
  yargs.option('yes', {
    describe: 'Skip the "are you sure" confirmation',
    type: 'boolean',
    default: false
  })
}

exports.handler = publish
