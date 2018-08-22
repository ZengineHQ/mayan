'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump')
const htmlmin = require('gulp-htmlmin')
const replace = require('gulp-replace')
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
      // First include external dependencies.
      gulp.src(`${temp}/node_modules/**/*.html`),
      // Then include common dependencies.
      gulp.src(`${temp}/common/**/*.html`),
      // Now add our actual source code.
      gulp.src(`${src}/src/{,!(node_modules)/**/}/*.html`),
      concat('plugin.html'),
      replace('wgn-', camelCaseToDash(plugin.namespace) + '-'),
      replace('wgn', plugin.namespace),
      ...extraSteps,
      gulp.dest(dest)
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
