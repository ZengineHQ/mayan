'use strict'

const argv = require('yargs').argv;

const context = require('../context')

module.exports = () => {
  return context(argv).then(ctx => {

    console.log(ctx)

    // process.exit()


    return publishPlugin(data.id).then(() => {
      return data
    })
  });
}

const publishPlugin = id => {

}
