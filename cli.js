#!/usr/bin/env node
const fs = require('fs')
const yargs = require('yargs')
const kleur = require('kleur')

function parseConfig (configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')

updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 8 // 8 hours
}).notify({ isGlobal: true })

function onFail(msg, err) {
  console.log()
  console.log()
  console.log(kleur.red('Failed, please fix the issues above. Use --help for available options.'))
  console.log()
}

const argv = yargs
  .commandDir('cmds')
  .option('env', { description: 'Environment name', requiresArg: true, alias: 'e' })
  .env('MAYAN')
  .config('config', parseConfig)
  .demandCommand(1, '')
  .strict()
  .showHelpOnFail(false)
  .help()
  // Keep things simple unless advanced users use --show-hidden
  .hide('config')
  .hide('version')
  .showHidden('show-hidden', 'Show advanced options')
  .epilogue('For more information, RTFM at https://github.com/ZengineHQ/mayan')
  .fail(onFail)
  .argv
