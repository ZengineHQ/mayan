exports.command = 'build [plugin]'

exports.desc = 'Build plugin'

exports.builder = function(yargs) {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
}

exports.handler = function(argv) {
  console.log(argv)
  console.log('the command....')
}