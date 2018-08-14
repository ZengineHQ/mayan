#!/usr/bin/env node
const fs = require('fs')

function parseConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 8 // 8 hours
}).notify();

require('yargs')
  .commandDir('cmds')
  .option('env', { description: 'Environment name', requiresArg: true })
  .env('MAYAN')
  .config('config', parseConfig)
  .demandCommand(1, '')
  .strict()
  .help()
  // Keep things simple unless advanced users use --show-hidden
  .hide('config')
  .hide('version')
  .showHidden('show-hidden', 'Show advanced options')
  .epilogue('For more information, RTFM at https://github.com/ZengineHQ/mayan')
  .argv
