'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump')
const sass = require('gulp-sass')
const replace = require('gulp-replace')

// Concatenate, compile and minify SASS.
const buildCss = (src, dest, plugin, prod = false) => {
  const options = prod ? { outputStyle: 'compressed' } : { sourceMap: true, outputStyle: 'expanded' }
  return new Promise((resolve, reject) => {
    pump([
      gulp.src([`${src}/src/*.scss`, `${src}/src/*.css`]),
      concat('plugin.css'),
      sass(options),
      replace('wgn', plugin.namespace),
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

module.exports = buildCss
