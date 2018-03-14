#!/usr/bin/env node

const pkg = require('./package')

require('yargs')
  .commandDir('cmds')
  .option('frontend', { description: 'Frontend plugin name', boolean: true })
  .option('backend', { description: 'Backend plugin name', boolean: true })
  .option('env', { requiresArg: true, description: 'Environment name' })
  .demandCommand()
  .help()
  .argv
