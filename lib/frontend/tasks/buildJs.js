'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const pump = require('pump')
const replace = require('gulp-replace')
const camelCaseToDash = require('../../util').camelCaseToDash

/**
 * Concatenate, transpile and minify javascript.
 *
 * @param {string} src The source directory.
 * @param {string} temp The temporary directory.
 * @param {string} dest The destination directory.
 * @param {Object} plugin The plugin definition.
 * @param {boolean} prod Whether to build in production mode.
 *
 * @returns {Promise<any>}
 */
const buildJs = (src, temp, dest, plugin, prod = false) => {
  const tempPath = `${temp}/src`
  const extraSteps = prod ? [uglify()] : []

  return new Promise((resolve, reject) => {
    pump([
      gulp.src([`${src}/src/{,!(node_modules)/**/}/*.js`, `${src}/plugin-register.js`]),
      babel({
        presets: [require('@babel/preset-env')],
        plugins: [
          [require('@babel/plugin-transform-strict-mode'), { 'strict': false }],
          [require('@babel/plugin-proposal-object-rest-spread').default]
        ]
      }),
      // Remove any other incidental use strict declarations.
      replace('\'use strict\';', ''),
      replace('{replace-route}', plugin.route),
      gulp.dest(tempPath)
    ], err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  }).then(() => {
    return new Promise((resolve, reject) => {
      pump([
        // First include external dependencies.
        gulp.src(`${temp}/node_modules/**/*.js`),
        // Then include common dependencies.
        gulp.src(`${temp}/common/**/*.js`),
        // Now add our actual source code.
        gulp.src([`${tempPath}/**/*.js`, `!${tempPath}/plugin-register.js`]),
        // Finally, plugin registration comes last.
        gulp.src(`${tempPath}/plugin-register.js`),
        concat('plugin.js'),
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
  })
}

module.exports = buildJs
