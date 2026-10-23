'use strict'

const vfs = require('vinyl-fs')
const concat = require('../concat')
const terser = require('gulp-terser')
const babel = require('gulp-babel')
const pump = require('pump')
const replace = require('gulp-replace')
const sources = require('../sources')
const { camelCaseToDash, kebabToCamelCase } = require('../../util')

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
  const extraSteps = prod ? [terser()] : []

  return new Promise((resolve, reject) => {
    pump([
      sources([
        { dir: `${src}/src`, ext: '.js', skip: ['node_modules'] },
        { file: `${src}/plugin-register.js` }
      ]),
      babel({
        presets: [require('@babel/preset-env')],
        plugins: [
          [require('@babel/plugin-transform-strict-mode'), { strict: false }],
          [require('@babel/plugin-proposal-object-rest-spread').default]
        ]
      }),
      // Remove any other incidental use strict declarations.
      replace('\'use strict\';', ''),
      replace('{replace-route}', plugin.route),
      vfs.dest(tempPath)
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
        sources([
          // First include external dependencies.
          { dir: `${temp}/node_modules`, ext: '.js' },
          // Then include common dependencies.
          { dir: `${temp}/common`, ext: '.js' },
          // Now add our actual source code.
          { dir: tempPath, ext: '.js', skip: ['plugin-register.js'] },
          // Finally, plugin registration comes last.
          { file: `${tempPath}/plugin-register.js` }
        ]),
        concat('plugin.js'),
        replace(/wgn([A-Za-z])/g, (match, first) => `${kebabToCamelCase(plugin.namespace)}${first.toUpperCase()}`),
        replace('wgn-', camelCaseToDash(plugin.namespace) + '-'),
        replace('wgn', plugin.namespace),
        ...extraSteps,
        vfs.dest(dest)
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
