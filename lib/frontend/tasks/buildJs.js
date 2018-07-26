'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const pump = require('pump')
const replace = require('gulp-replace')

// Concatenate, transpile and minify javascript.
const buildJs = (src, dest, plugin, prod = false) => {
  const extraSteps = prod ? [uglify()] : []

  return new Promise((resolve, reject) => {
    pump([
      gulp.src([`${src}/*.js`, `${src}/src/*.js`]),
      concat('plugin.js'),
      babel({
        presets: ['env'],
        plugins: [['transform-strict-mode', { 'strict': false }]]
      }),
      replace("'use strict';", ''),
      replace('wgn', plugin.namespace),
      replace('{replace-route}', plugin.route),
      ...extraSteps,
      gulp.dest(`${dest}/${plugin.configName}`)
    ], err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

module.exports = buildJs
