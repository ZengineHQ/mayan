'use strict'

const execa = require('execa')

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
    .normalize('NFD') 				 // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/(\-|\_)/g, '')        // remove hipens and underscores
    .replace(/\s+/g, '')            // remove spaces
    .replace(/&/g, '-and-')          // replace & with 'and'
    .replace(/[^\w\-]+/g, '')        // remove all non-word chars

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
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([0-9])([^0-9])/g, '$1-$2')
    .replace(/([^0-9])([0-9])/g, '$1-$2')
    .replace(/-+/g, '-')
    .toLowerCase()
}

/**
 * Runs a package.json script in the given path.
 *
 * @param {string} path
 * @param {string} script
 * @param {string} environment
 *
 * @returns {Promise<any>}
 */
exports.runScript = (path, script, environment) => {
  const pkg = require(`${path}/package.json`)

  if ('scripts' in pkg && typeof pkg.scripts === 'object') {
    if (script in pkg.scripts && pkg.scripts[script]) {
      return execa(`npm run ${script}`, { cwd: path, env: { 'MAYA_ENV': environment } })
    }
  }

  return Promise.resolve();
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
  return arr.reduce((promise, cb) => {
    return promise.then(() => cb(...args)).catch(err => console.error(err))
  }, Promise.resolve())
}
