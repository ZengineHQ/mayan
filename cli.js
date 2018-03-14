#!/usr/bin/env node
const fs = require('fs')

function parseConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

require('yargs')
  .commandDir('cmds')
  .option('frontend', { description: 'Frontend plugin name', boolean: true })
  .option('backend', { description: 'Backend plugin name', boolean: true })
  .option('env', { description: 'Environment name', requiresArg: true })
  .env('MAYA')
  .config('config', parseConfig)
  .demandCommand()
  .help()
  .argv
