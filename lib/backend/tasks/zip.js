'use strict'

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { promisify } = require('util')

const deflateRaw = promisify(zlib.deflateRaw)

const SIG_LOCAL = 0x04034b50
const SIG_CENTRAL = 0x02014b50
const SIG_END = 0x06054b50
const SIG_END64 = 0x06064b50
const SIG_LOCATOR64 = 0x07064b50
const VERSION_MADE_BY = 0x0314 // Unix, spec 2.0
const VERSION_NEEDED = 20
const FLAG_UTF8 = 0x0800
const METHOD_STORED = 0
const METHOD_DEFLATED = 8
const DOS_DIRECTORY = 0x10
const MAX_32 = 0xFFFFFFFF
const MAX_16 = 0xFFFF

// Zip timestamps are DOS date and time words with two second resolution, taken in UTC here.
const dosDateTime = date => {
  const year = Math.max(date.getUTCFullYear(), 1980)
  const time = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1)
  const day = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate()

  return { time, date: day }
}

const compareNames = (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0

/**
 * Lists everything under dir as zip entries, parents before children and siblings in byte
 * order. Directories become entries with a trailing slash, symbolic links are kept as links
 * with their target as the contents, and anything else that is not a regular file is skipped.
 */
const listEntries = async (dir, prefix = '') => {
  const entries = []
  const names = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const dirent of names.sort(compareNames)) {
    const full = path.join(dir, dirent.name)
    const name = prefix + dirent.name
    const stat = await fs.promises.lstat(full)

    if (stat.isDirectory()) {
      entries.push({ name: name + '/', type: 'directory', stat })
      entries.push(...await listEntries(full, name + '/'))
    } else if (stat.isSymbolicLink()) {
      entries.push({ name, type: 'symlink', stat, contents: Buffer.from(await fs.promises.readlink(full)) })
    } else if (stat.isFile()) {
      entries.push({ name, type: 'file', stat, path: full })
    }
  }

  return entries
}

const localHeader = (entry, nameBytes) => {
  const header = Buffer.alloc(30)

  header.writeUInt32LE(SIG_LOCAL, 0)
  header.writeUInt16LE(VERSION_NEEDED, 4)
  header.writeUInt16LE(FLAG_UTF8, 6)
  header.writeUInt16LE(entry.method, 8)
  header.writeUInt16LE(entry.time, 10)
  header.writeUInt16LE(entry.date, 12)
  header.writeUInt32LE(entry.crc, 14)
  header.writeUInt32LE(entry.compressedSize, 18)
  header.writeUInt32LE(entry.size, 22)
  header.writeUInt16LE(nameBytes.length, 26)
  header.writeUInt16LE(0, 28)

  return Buffer.concat([header, nameBytes])
}

const centralHeader = (entry, nameBytes) => {
  const header = Buffer.alloc(46)
  const externalAttributes = ((entry.stat.mode & MAX_16) * 0x10000) + (entry.type === 'directory' ? DOS_DIRECTORY : 0)

  header.writeUInt32LE(SIG_CENTRAL, 0)
  header.writeUInt16LE(VERSION_MADE_BY, 4)
  header.writeUInt16LE(VERSION_NEEDED, 6)
  header.writeUInt16LE(FLAG_UTF8, 8)
  header.writeUInt16LE(entry.method, 10)
  header.writeUInt16LE(entry.time, 12)
  header.writeUInt16LE(entry.date, 14)
  header.writeUInt32LE(entry.crc, 16)
  header.writeUInt32LE(entry.compressedSize, 20)
  header.writeUInt32LE(entry.size, 24)
  header.writeUInt16LE(nameBytes.length, 28)
  header.writeUInt16LE(0, 30) // extra field length
  header.writeUInt16LE(0, 32) // comment length
  header.writeUInt16LE(0, 34) // disk number
  header.writeUInt16LE(0, 36) // internal attributes
  header.writeUInt32LE(externalAttributes, 38)
  header.writeUInt32LE(entry.offset, 42)

  return Buffer.concat([header, nameBytes])
}

const endRecords = (count, centralSize, centralOffset) => {
  const records = []
  const needs64 = count > MAX_16 || centralSize > MAX_32 || centralOffset > MAX_32

  if (needs64) {
    const end64 = Buffer.alloc(56)
    const locator = Buffer.alloc(20)

    end64.writeUInt32LE(SIG_END64, 0)
    end64.writeBigUInt64LE(BigInt(44), 4)
    end64.writeUInt16LE(VERSION_MADE_BY, 12)
    end64.writeUInt16LE(45, 14)
    end64.writeUInt32LE(0, 16)
    end64.writeUInt32LE(0, 20)
    end64.writeBigUInt64LE(BigInt(count), 24)
    end64.writeBigUInt64LE(BigInt(count), 32)
    end64.writeBigUInt64LE(BigInt(centralSize), 40)
    end64.writeBigUInt64LE(BigInt(centralOffset), 48)

    locator.writeUInt32LE(SIG_LOCATOR64, 0)
    locator.writeUInt32LE(0, 4)
    locator.writeBigUInt64LE(BigInt(centralOffset + centralSize), 8)
    locator.writeUInt32LE(1, 16)

    records.push(end64, locator)
  }

  const end = Buffer.alloc(22)

  end.writeUInt32LE(SIG_END, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(Math.min(count, MAX_16), 8)
  end.writeUInt16LE(Math.min(count, MAX_16), 10)
  end.writeUInt32LE(Math.min(centralSize, MAX_32), 12)
  end.writeUInt32LE(Math.min(centralOffset, MAX_32), 16)
  end.writeUInt16LE(0, 20)

  records.push(end)

  return Buffer.concat(records)
}

/**
 * Writes a zip archive of everything under dir to zipPath, with entry names relative to dir.
 * Regular files are deflated, directories and symbolic links are stored, and unix modes are
 * kept. Archives over 4 GB are not supported; more than 65535 entries are.
 *
 * @param {string} dir The directory to archive.
 * @param {string} zipPath Where to write the archive.
 *
 * @returns {Promise<void>}
 */
const zipDirectory = async (dir, zipPath) => {
  const entries = await listEntries(dir)
  const handle = await fs.promises.open(zipPath, 'w')
  const central = []
  let offset = 0

  const write = async buffer => {
    await handle.write(buffer)
    offset += buffer.length
  }

  try {
    for (const entry of entries) {
      const contents = entry.type === 'file' ? await fs.promises.readFile(entry.path) : entry.contents || Buffer.alloc(0)
      const compressed = entry.type === 'file' ? await deflateRaw(contents) : contents
      const nameBytes = Buffer.from(entry.name, 'utf8')

      Object.assign(entry, dosDateTime(entry.stat.mtime), {
        method: entry.type === 'file' ? METHOD_DEFLATED : METHOD_STORED,
        crc: zlib.crc32(contents),
        size: contents.length,
        compressedSize: compressed.length,
        offset
      })

      if (entry.size > MAX_32 || entry.compressedSize > MAX_32 || entry.offset > MAX_32) {
        throw new Error(`Cannot create ${zipPath}: archives over 4 GB are not supported`)
      }

      await write(localHeader(entry, nameBytes))
      await write(compressed)
      central.push(centralHeader(entry, nameBytes))
    }

    const centralOffset = offset
    const centralBuffer = Buffer.concat(central)

    await write(centralBuffer)
    await write(endRecords(entries.length, centralBuffer.length, centralOffset))
  } catch (err) {
    await handle.close()
    await fs.promises.rm(zipPath, { force: true })
    throw err
  }

  await handle.close()
}

module.exports = zipDirectory
