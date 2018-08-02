'use strict'

const context = require('./context')
const registerFrontend = require('./register/frontend')
const registerBackend = require('./register/backend')
const publish = require('./register/publish')
const runSequential = require('./util').runSequential

function createRegister(argv) {
  return context(argv).then(ctx => {

    const promises = [
      registerFrontend,
      registerBackend
    ]

    if (argv.publish) {
      promises.push(publish)
    }

    return runSequential(promises, ctx)
  })
}

module.exports = createRegister
