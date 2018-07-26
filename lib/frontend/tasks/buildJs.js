'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const pump = require('pump')

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
      namespace(),
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
