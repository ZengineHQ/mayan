'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump')
const htmlmin = require('gulp-htmlmin')
const replace = require('gulp-replace')

// Concatenate and minify HTML.
const buildHtml = (src, dest, plugin, prod = false) => {
  const options = prod ? {
    collapseWhitespace: true,
    caseSensitive: true,
    collapseInlineTagWhitespace: true,
    removeComments: true
  } : { caseSensitive: true }

  return new Promise((resolve, reject) => {
    pump([
      gulp.src(`${src}/src/*.html`),
      concat('plugin.html'),
      replace('wgn', plugin.namespace),
      htmlmin(options),
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
