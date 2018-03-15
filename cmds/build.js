'use strict';

const build = require('../lib/build');

exports.command = 'build [plugin]'

exports.desc = 'Build plugin'

exports.builder = function(yargs) {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
}

exports.handler = build;
