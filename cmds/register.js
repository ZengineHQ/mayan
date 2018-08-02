'use strict'

const register = require('../lib/register')

exports.command = 'register [plugin]'

exports.desc = 'Register plugin in Zengine API'

exports.builder = yargs => {
  yargs.option('dev', {
    describe: 'Only register a dev version of the plugin',
    type: 'boolean',
    default: false
  })
  yargs.option('prod', {
    describe: 'Only register a prod version of the plugin',
    type: 'boolean',
    default: false
  })
  yargs.option('publish', {
    describe: 'Publish the plugin after registering it',
    type: 'boolean',
    default: false
  })
}

exports.handler = register
