'use strict'

module.exports = ctx => {
  console.log(ctx)
  process.exit()

  return publishPlugin(data.id).then(() => {
    return data
  })
}

const publishPlugin = id => {

}
