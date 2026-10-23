'use strict'

const fs = require('fs')
const pathUtils = require('path')
const crypto = require('crypto')
const { execa } = require('execa')
const { gray, blue, yellow } = require('kleur')
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)
const { compare } = require('compare-versions');

/**
 * Transforms a string into a camelized slug.
 *
 * @param {string} text
 * @return {string}
 *
 * Based on https://gist.github.com/eek/9c4887e80b3ede05c0e39fee4dce3747
 */
exports.slugify = text => {
  const slug = text.toString().trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/(-|_)/g, '') // remove hipens and underscores
    .replace(/\s+/g, '') // remove spaces
    .replace(/&/g, '-and-') // replace & with 'and'
    .replace(/[^\w-]+/g, '') // remove all non-word chars

  return slug.charAt(0).toLowerCase() + slug.substr(1)
}
exports.supportedNpm = () => {
  return '8.05.0'
}
exports.supportedNode = () => {
  return '14.0.0'
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
  const pkgPath = pathUtils.resolve(`${path}/package.json`)

  if (fs.existsSync(pkgPath)) {
    const pkg = require(pkgPath)

    if ('scripts' in pkg && typeof pkg.scripts === 'object') {
      if (script in pkg.scripts && pkg.scripts[script]) {
        return execa('npm', ['run', script], { cwd: path, env: { MAYA_ENV: environment } }).then(res => res.stdout)
      }
    }
  }

  return Promise.resolve()
}

/**
 *
 * @param command
 * @param args
 * @param options
 * @returns {Promise<unknown>}
 */
exports.runCommand = (command, args, options) => {
  return new Promise((resolve, reject) => {
    const { scope, successMessage } = options;
    console.log(
      gray('[%s] Executing command: "%s %s"',
        scope,
        command,
        args.join(' ')
      ));
    const { scope: _scope, successMessage: _msg, ...execaOptions } = options // eslint-disable-line no-unused-vars
    const subprocess = execa(command, args, execaOptions);
    subprocess.stdout.setEncoding('utf8');
    subprocess.stdout.on('data', (data) => {
      console.log(gray('[%s] %s'), scope, data);
    });
    subprocess.stderr.setEncoding('utf8');
    subprocess.stderr.on('data', (data) => {
      console.log(gray('[%s] %s'), scope, data);
    });
    // execa >= 9 returns a promise-like subprocess rather than a ChildProcess.
    subprocess.then(({ exitCode }) => {
      if (successMessage) {
        console.log(blue('[%s] %s'), scope, successMessage);
      }
      resolve(exitCode);
    }, error => reject(error.exitCode || error));
  });
}
/**
 * Check if a nvm exists for code consistency
 *
 * @param origin
 * @param scope
 * @returns {Promise<void>}
 */
exports.checkNvm = async (path) => {
  try {
    if (!fs.existsSync(path)) {
      throw new Error('no nvm ' + path)
    }
    const { stdout: version } = await exec('node --version')
    if (compare(`${version.trim()}`, this.supportedNode(), '<')) {
      console.log(yellow(`Your node version ${version} is not supported. Use the latest version >= ${this.supportedNode()} and rebuild node_modules.`))
    }
  } catch (error) {
    console.log(yellow(`No .nvmrc file found. Please add one to the root of your plugin to help development. Using Node ${this.supportedNode()} or greater.`))
  }
}

/**
 * Check if a nvm exists for code consistency
 *
 * @param origin
 * @param scope
 * @returns {Promise<void>}
 */
exports.checkNpmVersion = async () => {
  try {
    const { stdout: version } = await exec('npm --version')
    if (compare(`${version.trim().replace('v', '')}`, this.supportedNpm(), '<')) {
      console.log(yellow(`Your NPM version ${version} is not supported (> ${this.supportedNpm()}). Use the latest version npm install npm@8 and rebuild node_modules ${process.version}.`))
    }
  } catch (error) {
    console.log(yellow(`Npm is either not installed or not a version >= ${this.supportedNpm()}`))
  }
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
 * Copies a directory recursively, replacing anything already at `dest`.
 *
 * @param {string} src
 * @param {string} dest
 *
 * @returns {Promise<any>}
 */
exports.copyDir = async (src, dest) => {
  await fs.promises.rm(dest, { recursive: true, force: true })

  fs.mkdirSync(dest, { recursive: true })

  return fs.promises.cp(src, dest, { recursive: true, force: true })
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

/**
 * Builds a chokidar "ignored" matcher that drops each of the given directories and anything beneath them.
 * chokidar 4 no longer accepts globs, so the watchers pass directories and filter with this instead.
 *
 * @param {string[]} dirs Directories to ignore, absolute or relative to the working directory.
 *
 * @returns {function(string): boolean}
 */
exports.ignoredPaths = dirs => {
  const resolved = dirs.map(dir => pathUtils.resolve(dir))

  return file => {
    const abs = pathUtils.resolve(file)

    return resolved.some(dir => abs === dir || abs.startsWith(dir + pathUtils.sep))
  }
}

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

exports.safeJSONParse = string => {
  try {
    return JSON.parse(string)
  } catch (error) {
    console.error('Error caught while parsing JSON:', error)
    return null
  }
}

let ngrokUrl = ''

exports.getNgrokUrl = () => ngrokUrl

exports.setNgrokUrl = url => {
  ngrokUrl = url

  return ngrokUrl
}

/**
 * Ask a yes/no question on the terminal. Mirrors the old prompt-confirm behaviour:
 * an empty answer takes the default, and only y / yes / true (any case) count as yes.
 *
 * @param {string} question The question to display.
 * @param {Object} [options]
 * @param {boolean} [options.defaultYes=true] Answer used when the user just presses enter.
 * @param {NodeJS.ReadableStream} [options.input=process.stdin]
 * @param {NodeJS.WritableStream} [options.output=process.stdout]
 *
 * @returns {Promise<boolean>}
 */
exports.confirm = (question, { defaultYes = true, input = process.stdin, output = process.stdout } = {}) => {
  const readline = require('readline')
  const rl = readline.createInterface({ input, output })

  return new Promise(resolve => {
    rl.question(`${question} (${defaultYes ? 'Y/n' : 'y/N'}) `, answer => {
      rl.close()

      const trimmed = answer.trim()

      resolve(trimmed === '' ? defaultYes : /^(y(es)?|true)$/i.test(trimmed))
    })
  })
}
