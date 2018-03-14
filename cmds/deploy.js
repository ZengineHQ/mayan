exports.command = 'deploy [plugin]'

exports.desc = 'Deploy plugin'

exports.builder = function(yargs) {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
}

exports.handler = function(argv) {
  console.log('the command....')
}