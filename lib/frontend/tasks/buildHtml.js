'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump')
const htmlmin = require('gulp-htmlmin')

// Concatenate and minify HTML.
const buildHtml = (src, dest, plugin) => {
  return new Promise((resolve, reject) => {
    pump([
      gulp.src(`${src}/src/*.html`),
      concat('plugin.html'),
      htmlmin({
        collapseWhitespace: true,
        caseSensitive: true,
        collapseInlineTagWhitespace: true,
        removeComments: true
      }),
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

module.exports = buildHtml
