'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump')
const sass = require('gulp-sass')
const replace = require('gulp-replace')
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
  const tempPath = `${temp}/src`
  const options = prod ? { outputStyle: 'compressed' } : { sourceMap: true, outputStyle: 'expanded' }

  return new Promise((resolve, reject) => {
    pump([
      // First include external dependencies.
      gulp.src(`${temp}/node_modules/**/*.css`),
      // Then include common dependencies.
      gulp.src(`${temp}/common/**/*.css`),
      // Now add our actual source code.
      gulp.src([`${src}/src/{,!(node_modules)/**/}/*.scss`, `${src}/src/{,!(node_modules)/**/}/*.css`]),
      concat('plugin.css'),
      sass(options),
      replace('wgn-', camelCaseToDash(plugin.namespace) + '-'),
      replace('wgn', plugin.namespace),
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

module.exports = buildCss
