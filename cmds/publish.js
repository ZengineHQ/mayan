const publish = require('../lib/publish');

exports.command = 'publish [plugin]'

exports.desc = 'Publish plugin'

exports.builder = function(yargs) {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
}

exports.handler = publish;
