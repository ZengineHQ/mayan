'use strict'

const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const { isUtf8 } = require('buffer')
const Vinyl = require('vinyl')

/**
 * Lists the files under dir that end with ext, in the order gulp 4 used to concatenate them:
 * shallower files always come before deeper ones, and files at the same depth are ordered by
 * their path segments in byte order. Names starting with a dot are ignored at every level and
 * names listed in skip are ignored at the top level only. A missing dir yields no files.
 *
 * @param {string} dir The directory to list.
 * @param {string} ext The file extension to keep, including the dot.
 * @param {string[]} skip Top-level entry names to leave out.
 *
 * @returns {Promise<string[]>}
 */
const listFiles = async (dir, ext, skip = []) => {
  const found = []

  const walk = async (current, segments) => {
    let entries

    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true })
    } catch (err) {
      if (segments.length === 0 && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) {
        return
      }

      throw err
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') || (segments.length === 0 && skip.includes(entry.name))) {
        continue
      }

      const full = path.join(current, entry.name)
      let stat = entry

      if (entry.isSymbolicLink()) {
        stat = await fs.promises.stat(full).catch(() => null)

        if (!stat) {
          continue
        }
      }

      if (stat.isDirectory()) {
        await walk(full, [...segments, entry.name])
      } else if (stat.isFile() && entry.name.endsWith(ext)) {
        found.push({ segments: [...segments, entry.name], path: full })
      }
    }
  }

  await walk(dir, [])

  return found.sort(compareBreadthFirst).map(file => file.path)
}

const compareBreadthFirst = (a, b) => {
  if (a.segments.length !== b.segments.length) {
    return a.segments.length - b.segments.length
  }

  for (let i = 0; i < a.segments.length; i++) {
    if (a.segments[i] !== b.segments[i]) {
      return a.segments[i] < b.segments[i] ? -1 : 1
    }
  }

  return 0
}

// gulp.src stripped a UTF-8 byte order mark, so keep doing that.
const stripBom = contents => {
  if (contents.length >= 3 && contents[0] === 0xEF && contents[1] === 0xBB && contents[2] === 0xBF && isUtf8(contents)) {
    return contents.subarray(3)
  }

  return contents
}

async function * readGroups (groups) {
  for (const group of groups) {
    const base = group.file ? path.dirname(group.file) : group.dir
    const files = group.file ? [group.file] : await listFiles(group.dir, group.ext, group.skip)

    for (const file of files) {
      let contents
      let stat

      try {
        [contents, stat] = await Promise.all([fs.promises.readFile(file), fs.promises.stat(file)])
      } catch (err) {
        throw err.code === 'ENOENT' ? new Error(`File not found: ${file}`) : err
      }

      yield new Vinyl({ cwd: process.cwd(), base, path: file, stat, contents: stripBom(contents) })
    }
  }
}

/**
 * Creates a readable stream of vinyl files from an ordered list of groups, to feed the build
 * pipelines. Groups are emitted strictly in the order given. A group is either
 * { file } for a single required file, or { dir, ext, skip } for every file under dir with
 * that extension (see listFiles for the ordering rules).
 *
 * @param {Array<{file?: string, dir?: string, ext?: string, skip?: string[]}>} groups
 *
 * @returns {Readable}
 */
const sources = groups => Readable.from(readGroups(groups))

sources.listFiles = listFiles

module.exports = sources
