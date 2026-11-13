'use strict'

const path = require('path')
const { Transform } = require('stream')
const Vinyl = require('vinyl')

/**
 * Joins every vinyl file that passes through into a single file named fileName, the way
 * gulp-concat did: contents are joined with a newline between files (none at the end), the
 * output takes its stat from the most recently modified input so vinyl-fs keeps the same mode,
 * and nothing is emitted when no files came through.
 *
 * @param {string} fileName The name of the joined file, relative to the destination.
 *
 * @returns {Transform}
 */
const concat = fileName => {
  if (!fileName) {
    throw new Error('concat: Missing file name')
  }

  const parts = []
  let latest

  return new Transform({
    objectMode: true,
    transform (file, encoding, callback) {
      if (file.isNull()) {
        callback()
        return
      }

      if (file.isStream()) {
        callback(new Error('concat: Streaming not supported'))
        return
      }

      const mtime = file.stat && file.stat.mtime

      if (!latest || (mtime && (!latest.mtime || mtime > latest.mtime))) {
        latest = { file, mtime }
      }

      if (parts.length > 0) {
        parts.push(Buffer.from('\n'))
      }

      parts.push(file.contents)
      callback()
    },
    flush (callback) {
      if (!latest) {
        callback()
        return
      }

      const base = latest.file.base

      callback(null, new Vinyl({
        cwd: latest.file.cwd,
        base,
        path: path.join(base, fileName),
        stat: latest.file.stat,
        contents: Buffer.concat(parts)
      }))
    }
  })
}

module.exports = concat
