'use strict'

const publish = require('../lib/publish')

exports.command = 'publish [plugin]'

exports.desc = 'Publish plugin'

exports.builder = (yargs) => {
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
    describe: 'Firebase URL without path ex: http://example.firebaseio.com',
    type: 'string'
  })
  yargs.option('firebase-secret', {
    describe: 'Firebase Secret',
    type: 'string'
  })
}

exports.handler = publish
