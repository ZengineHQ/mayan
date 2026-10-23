'use strict'

const vfs = require('vinyl-fs')
const concat = require('gulp-concat')
const pump = require('pump')
const htmlmin = require('gulp-html-minifier-terser')
const replace = require('gulp-replace')
const sources = require('../sources')
const camelCaseToDash = require('../../util').camelCaseToDash

/**
 * Concatenate and minify HTML.
 *
 * @param {string} src The source directory.
 * @param {string} temp The temporary directory.
 * @param {string} dest The destination directory.
 * @param {Object} plugin The plugin definition.
 * @param {boolean} prod Whether to build in production mode.
 *
 * @returns {Promise<any>}
 */
const buildHtml = (src, temp, dest, plugin, prod = false) => {
  const options = {
    collapseWhitespace: true,
    caseSensitive: true,
    collapseInlineTagWhitespace: true,
    conservativeCollapse: true,
    trimCustomFragments: true,
    removeComments: true
  }
  const extraSteps = prod ? [htmlmin(options)] : []

  return new Promise((resolve, reject) => {
    pump([
      sources([
        // First include external dependencies.
        { dir: `${temp}/node_modules`, ext: '.html' },
        // Then include common dependencies.
        { dir: `${temp}/common`, ext: '.html' },
        // Now add our actual source code.
        { dir: `${src}/src`, ext: '.html', skip: ['node_modules'] }
      ]),
      concat('plugin.html'),
      replace('wgn-', camelCaseToDash(plugin.namespace) + '-'),
      replace('wgn', plugin.namespace),
      ...extraSteps,
      vfs.dest(dest)
    ], err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

module.exports = buildHtml
