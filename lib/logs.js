'use strict'

const { context } = require('./context')
const logsBackend = require('./backend/logs')
const { runSequential, printErrorAndAbort } = require('./util')

const onError = printErrorAndAbort('build command')

function tailLogs (argv) {
  return context(argv)
    .then(ctx => {
      const promises = []

      console.log(argv)
      if (argv.service) {
        promises.push(logsBackend)
      }

      return runSequential(promises, ctx, argv)
    })
    .catch(onError)
}

module.exports = tailLogs
