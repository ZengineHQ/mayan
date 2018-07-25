'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const pump = require('pump');
const sass = require('gulp-sass');

// Concatenate, compile and minify SASS.
const buildCss = (src, dest, plugin) => {
  return new Promise((resolve, reject) => {
    pump([
      gulp.src([`${src}/src/*.scss`, `${src}/src/*.css`]),
      concat('plugin.css'),
      sass({outputStyle: 'compressed'}),
      gulp.dest(`${dest}/${plugin.configName}`)
    ], err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}

module.exports = buildCss
