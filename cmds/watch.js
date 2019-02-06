const watch = require('../lib/watch')

exports.command = ['watch [plugin]', 'w']

exports.desc = 'Watch plugin and deploy on changes'

exports.builder = yargs => {
  yargs.positional('plugin', {
    describe: 'Plugin name',
    type: 'string',
    default: '*'
  })
  yargs.option('frontend', {
    describe: 'Only watch frontend plugins',
    type: 'boolean',
    alias: 'f',
    default: false
  })
  yargs.option('backend', {
    describe: 'Only watch backend services',
    type: 'boolean',
    alias: 'b',
    default: false
  })
  yargs.option('skip-build', {
    describe: 'Skip building and attempt to deploy plugins directly',
    type: 'boolean',
    alias: 'sb',
    default: false
  })
  yargs.option('skip-minify', {
    describe: 'Skip minifying files when a production environment is detected',
    type: 'boolean',
    alias: 'sm',
    default: false
  })
  yargs.option('cache', {
    describe: 'TIP: Use --no-cache to disable caching of node_modules during watch',
    type: 'boolean',
    alias: 'c',
    default: true
  })
}

exports.handler = watch
