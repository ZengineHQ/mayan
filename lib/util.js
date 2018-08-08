'use strict'

const fs = require('fs')
const execa = require('execa')
const mkdirp = require('mkdirp')
const ncp = require('ncp').ncp

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
 * Runs one or more package.json scripts in the given path.
 *
 * @param {string} path
 * @param {string|Array<string>} script A script name or an array of script names.
 * @param {string} environment
 *
 * @returns {Promise<any>}
 */
exports.runScript = (path, script, environment) => {
  if (!fs.existsSync(`${path}/package.json`)) {
    return Promise.resolve()
  }

  const pkg = require(`${path}/package.json`)
  const scripts = Array.isArray(script) ? script.slice() : [script]
  const promises = []

  if ('scripts' in pkg && typeof pkg.scripts === 'object') {
    scripts.forEach(script => {
      if (script in pkg.scripts && pkg.scripts[script]) {
        promises.push(execa('npm', ['run', script], { cwd: path, env: { 'MAYA_ENV': environment } }).then(res => res.stdout))
      }
    })
  }

  return Promise.all(promises)
}

/**
 * Helper to handle the output from running scripts with runScript()
 *
 * @param {Array<string>|string} res
 * @param {Object} task
 */
exports.handleScriptOutput = (res, task) => {
  if (Array.isArray(res)) {
    res.forEach(r => {
      task.output = r
    })
  } else {
    task.output = res
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
    return promise.then(() => func(...args)).catch(err => {
      throw new Error(err)
    })
  }, Promise.resolve())
}

/**
 * Promise wrapper around ncp for convenience.
 * Copies a directory recursively.
 *
 * @param {string} src
 * @param {string} dest
 *
 * @returns {Promise<any>}
 */
exports.copyDir = (src, dest) => {
  mkdirp.sync(dest)

  return new Promise((resolve, reject) => {
    return ncp(src, dest, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}
