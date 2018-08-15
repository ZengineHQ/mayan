'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const pump = require('pump')
const replace = require('gulp-replace')
const camelCaseToDash = require('../../util').camelCaseToDash

// Concatenate, transpile and minify javascript.
const buildJs = (src, dest, plugin, prod = false) => {
  const tempPath = `${src}/build`
  const extraSteps = prod ? [uglify()] : []

  return new Promise((resolve, reject) => {
    pump([
      gulp.src([`${src}/src/{,!(node_modules)/**/}/*.js`, `${src}/plugin-register.js`]),
      babel({
        presets: [require('babel-preset-env')],
        plugins: [[require('babel-plugin-transform-strict-mode'), { 'strict': false }]]
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
        gulp.src([`${tempPath}/**/*.js`, `!${tempPath}/plugin-register.js`]),
        // Source this one separately so it's always last.
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
