'use strict'

const vfs = require('vinyl-fs')
const concat = require('gulp-concat')
const pump = require('pump')
const sass = require('gulp-sass')(require('sass'))
const replace = require('gulp-replace')
const sources = require('../sources')
const camelCaseToDash = require('../../util').camelCaseToDash

/**
 * Concatenate, compile and minify SASS.
 *
 * @param {string} src The source directory.
 * @param {string} temp The temporary directory.
 * @param {string} dest The destination directory.
 * @param {Object} plugin The plugin definition.
 * @param {boolean} prod Whether to build in production mode.
 *
 * @returns {Promise<any>}
 */
const buildCss = (src, temp, dest, plugin, prod = false) => {
  const options = prod ? { style: 'compressed' } : { style: 'expanded' }

  return new Promise((resolve, reject) => {
    pump([
      sources([
        // First include external dependencies.
        { dir: `${temp}/node_modules`, ext: '.css' },
        // Then include common dependencies.
        { dir: `${temp}/common`, ext: '.css' },
        // Now add our actual source code, SCSS before plain CSS.
        { dir: `${src}/src`, ext: '.scss', skip: ['node_modules'] },
        { dir: `${src}/src`, ext: '.css', skip: ['node_modules'] }
      ]),
      concat('plugin.css'),
      sass(options),
      replace('wgn-', camelCaseToDash(plugin.namespace) + '-'),
      replace('wgn', plugin.namespace),
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

module.exports = buildCss
