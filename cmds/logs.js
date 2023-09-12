'use strict'

const logs = require('../lib/logs')

exports.command = ['logs [service]', 'l']

exports.desc = 'Tail backend logs'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin Name',
    type: 'string',
    default: '*'
  })
  yargs.option('service', {
    describe: 'choose specific service to watch in the backend',
    type: 'string',
    alias: 's'
  })
  yargs.option('format', {
    describe: 'tail log format json,short,detailed',
    type: 'string',
    alias: 'f',
    default: 'short'
  })
  yargs.option('profile', {
    describe: 'AWS profile if you have multiple',
    type: 'string',
    alias: 'a'
  })
  yargs.option('hours', {
    describe: 'hours you want to go back in the logs for',
    type: 'string',
    alias: 'h',
    default: 24
  })
  yargs.option('draft', {
    describe: 'show draft uuid instead of published',
    type: 'boolean',
    alias: 'd',
    default: false
  })
}

exports.handler = logs
