'use strict'

const init = require('../lib/init')

exports.command = 'init [plugin]'

exports.desc = 'Initialize plugin'

exports.builder = yargs => {}

exports.handler = init
