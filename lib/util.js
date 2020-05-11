'use strict'

const fs = require('fs')
const crypto = require('crypto')
const execa = require('execa')
const ncp = require('ncp').ncp
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')

/**
 * Transforms a string into a camelized slug.
 *
 * @param {string} text
 * @return {string}
 *
 * Based on https://gist.github.com/eek/9c4887e80b3ede05c0e39fee4dce3747
 */
exports.slugify = text => {
  let slug = text.toString().trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/(-|_)/g, '') // remove hipens and underscores
    .replace(/\s+/g, '') // remove spaces
    .replace(/&/g, '-and-') // replace & with 'and'
    .replace(/[^\w-]+/g, '') // remove all non-word chars

  return slug.charAt(0).toLowerCase() + slug.substr(1)
}

/**
 * Transforms camelCase strings to dash-separated ones.
 *
 * @param {string} str
 * @return {string}
 *
 * Based on https://gist.github.com/youssman/745578062609e8acac9f
 */
exports.camelCaseToDash = str => {
  return str.toString().trim()
    .replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
    .toLowerCase()
}

/**
 * transforms kebab-case string to camelCase string
 *
 * @param {string} str
 * @return {string}
 */
exports.kebabToCamelCase = str => str.replace(/-(.)/g, (match, first) => first.toUpperCase())

/**
 * Runs a package.json scripts in the given path.
 *
 * @param {string} path
 * @param {string} script The script name.
 * @param {string} environment
 *
 * @returns {Promise<any>}
 */
exports.runScript = (path, script, environment) => {
  const pkgPath = `${path}/package.json`

  if (fs.existsSync(pkgPath)) {
    const pkg = require(pkgPath)

    if ('scripts' in pkg && typeof pkg.scripts === 'object') {
      if (script in pkg.scripts && pkg.scripts[script]) {
        return execa('npm', ['run', script], { cwd: path, env: { 'MAYA_ENV': environment } }).then(res => res.stdout)
      }
    }
  }

  return Promise.resolve()
}

/**
 * Run an array of functions that return promises in sequence, optionally passing args.
 * Based on https://gist.github.com/anvk/5602ec398e4fdc521e2bf9940fd90f84
 *
 * @param {Array<Function>} arr
 * @param {any} args
 *
 * @returns {Promise<any>}
 */
exports.runSequential = (arr, ...args) => {
  return arr.reduce((promise, func) => {
    return promise.then(() => func(...args))
  }, Promise.resolve())
}

/**
 * Copies a directory recursively.
 * Mostly a promise wrapper around ncp for convenience.
 *
 * @param {string} src
 * @param {string} dest
 *
 * @returns {Promise<any>}
 */
exports.copyDir = async (src, dest) => { // eslint-disable-line
  const options = { clobber: true, stopOnErr: true }

  if (fs.existsSync(dest)) {
    const deletion = await new Promise((resolve, reject) => rimraf(dest, err => err ? reject(err) : resolve()))
      .catch(err => new Error(err))

    if (deletion instanceof Error) {
      throw deletion
    }
  }

  mkdirp.sync(dest)

  return new Promise((resolve, reject) => ncp(src, dest, options, err => err ? reject(err) : resolve()))
}

/**
 * Function for extracting Node events as a callbag source
 * Intended in this library to be included in a pipe
 * Extra documentation is included in this function specific to this mayan context
 * in case someone isn't familiar with callbags.
 *
 * @param {EventEmitter} emitter Designed for chokidar file watcher events
 * @param {string} event name of event, e.g. 'change'
 *
 * @returns {Function(start: number, sink: Function(type: number, payload: Function() | any): void): void} callbag source
 *
 * @author Ben Steward (tehpsalmist)
 */
exports.fromNodeEvent = (emitter, event) => (start, sink) => {
  if (start !== 0) return // this callbag does not accept data, so only 0 is accepted

  /**
   * The handler will pass along the callback param through the callbag pipe
   * @param {string} path the path emitted by the change event
   */
  const handler = path => {
    return sink(1, path)
  }

  /**
   * Pass the start type to the consumer, which contains code to remove the event listener
   * (not used in this app)
   */
  sink(0, t => {
    if (t === 2) emitter.off(event, handler)
  })

  /**
   * Instantiate the listener which will use the handler to forward the event through the pipe
   */
  emitter.on(event, handler)

  /**
   * pre-populates the source with a value, so combine will be run on every event
   * as it will not forward any values until all source callbags have a value to emit.
   */
  emitter.emit(event, 'initialize')
}

/**
 * @param {string} str data to be used to generate checksum
 * @param {string} algorithm algor...oh nvm...
 * @param {encoding} encoding defaults to 'hex,' but you didn't need me to tell you that, did you?
 *
 * @returns {string} one checksum boi
 */
exports.checkSum = (str, algorithm, encoding) => crypto.createHash(algorithm || 'md5').update(str, 'utf8').digest(encoding || 'hex')

/**
 * Delay for a given number of milliseconds
 *
 * @param {number} ms
 *
 * @returns {Promise<void>}
 */
exports.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

exports.printErrorAndAbort = location => (err, keepAlive = false) => {
  if (err instanceof Error || typeof err === 'string') {
    console.error(`Error at ${location}`, err)
  } else {
    try {
      const message = JSON.stringify(err, null, 2)

      if (!message || message === '{}') {
        console.error(`An Unexpected Error Occurred at ${location}:`, err || '(error message not available)')
      } else {
        console.error(`Error at ${location}`, message)
      }
    } catch (e) {
      console.error(`An Unexpected Error Occurred at ${location}:`, err || '(error message not available)')
    }
  }

  if (keepAlive) {
    return
  }

  console.log('aborting the process')
  return process.kill(process.pid)
}
