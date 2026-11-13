'use strict'

const zipDirectory = require('./zip')

/**
 * Archives `${path}/${name}` into `${path}/${name}.zip`.
 *
 * @param {string} path The directory holding the build output.
 * @param {string} name The name of the directory to archive, which also names the zip.
 *
 * @returns {Promise<void>}
 */
const buildZip = (path, name) => zipDirectory(`${path}/${name}`, `${path}/${name}.zip`)

module.exports = buildZip
