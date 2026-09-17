'use strict'

const fs = require('fs')

/**
 * Remove a path recursively; succeeds if it does not exist.
 *
 * @param {string} path
 * @returns {Promise<void>}
 */
const cleanup = path => fs.promises.rm(path, { recursive: true, force: true })

module.exports = cleanup
