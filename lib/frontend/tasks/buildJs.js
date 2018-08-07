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
      gulp.src([`${src}/*.js`, `${src}/src/*.js`, `${tempPath}/node_modules/**/**/*.js`]),
      concat('plugin.js'),
      babel({
        presets: [require('babel-preset-env')],
        plugins: [[require('babel-plugin-transform-strict-mode'), { 'strict': false }]]
      }),
      // @TODO figure out why the babel plugin isn't working here.
      replace('\'use strict\';', ''),
      replace('wgn-', camelCaseToDash(plugin.namespace) + '-'),
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
