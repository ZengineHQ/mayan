'use strict'

const register = require('../lib/register')

exports.command = ['register [plugin]', 'r']

exports.desc = 'Register plugin in Zengine API'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('publish', {
    describe: 'Publish the plugin after registering it',
    type: 'boolean',
    default: false
  })
}

exports.handler = register
