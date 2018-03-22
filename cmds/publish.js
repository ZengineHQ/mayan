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
    type: 'string'
  })
}

exports.handler = publish
