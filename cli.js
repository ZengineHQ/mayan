#!/usr/bin/env node
// Fail fast with a clear message on unsupported Node versions. This must run before any
// dependency is loaded, because several of them crash with cryptic errors on older Node.
// The required version comes from .nvmrc so there is a single place to bump it.
const fs = require('fs')
const path = require('path')

const readRequiredNode = () => {
  try {
    return fs.readFileSync(path.join(__dirname, '.nvmrc'), 'utf8').trim()
  } catch (e) {
    return require('./package.json').engines.node
  }
}

const requiredNode = readRequiredNode()
const requiredMajor = Number(requiredNode.replace(/[^0-9.]/g, '').split('.')[0])
const currentMajor = Number(process.versions.node.split('.')[0])

if (currentMajor < requiredMajor) {
  console.error(`mayan requires Node.js ${requiredNode} or newer but is running on ${process.version}.`)
  console.error('Switch with "nvm use" or install a newer Node.js, then reinstall mayan.')
  process.exit(1)
}

const yargs = require('yargs')
const { red } = require('kleur')

function parseConfig (configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

const pkg = require('./package.json')

// update-notifier is ESM-only from v6, so load it with a dynamic import from this CommonJS file.
import('update-notifier')
  .then(({ default: updateNotifier }) => {
    updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60 * 8 // 8 hours
    }).notify({ isGlobal: true })
  })
  .catch(() => {}) // never let the update check break the CLI

function onFail(msg, err) {
  console.log(red('\n\nFailed, please fix the issues above. Use --help for available options.\n'))
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
