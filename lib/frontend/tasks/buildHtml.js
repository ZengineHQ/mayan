'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump')
const htmlmin = require('gulp-htmlmin')
const replace = require('gulp-replace')
const camelCaseToDash = require('../../util').camelCaseToDash

// Concatenate and minify HTML.
const buildHtml = (src, dest, plugin, prod = false) => {
  const tempPath = `${src}/build`
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
      gulp.src([`${src}/src/{,!(node_modules)/**/}/*.html`, `${tempPath}/node_modules/**/**/*.html`]),
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
