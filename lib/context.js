'use strict'

const format = require('util').format
const fs = require('fs')
const _ = require('lodash')

function getDefaultEnvName (mayaJSON) {
  if (!mayaJSON.environments) {
    return Promise.reject(new Error('Missing environments configuration file.'))
  }

  let name = false

  _.forEach(mayaJSON.environments, (v, k) => {
    if (!name && v.default === true) {
      name = k
    }
  })

  return name
}

function createNewContext (argv, mayaJSON) {
  if (_.isEmpty(argv) || !_.isObject(argv)) {
    return Promise.reject(new Error('Invalid and/or missing argv.'))
  }

  const ctx = _.cloneDeep(argv)

  const environmentName = ctx.env || getDefaultEnvName(mayaJSON)

  if (!ctx.env) {
    ctx.env = environmentName
  }

  if (!environmentName) {
    return Promise.reject(new Error(
      'Unknown environment, please update your maya.json with a default or pass a specific environment key using the --env argument.'
    ))
  }

  const environment = _.get(mayaJSON.environments, environmentName)

  if (!environment) {
    return Promise.reject(new Error(format(
      'Invalid environment name "%s".',
      environmentName
    )))
  }

  // create normalized version of plugins and services based on iterable arrays for consumption by the various command functions
  ctx.plugins = Object.keys(environment.plugins)
    // filter for only the plugins specified or all of them if none specificied (*)
    .filter(configName => ctx.plugin === '*' || configName === ctx.plugin)
    .reduce((list, pluginName) => [
      ...list,
      {
        configName: pluginName,
        ...environment.plugins[pluginName], // shallow copy, but we're ok with that here, since this object won't be mutated
        // convert plugin services to an array if it exists
        services: environment.plugins[pluginName].services && Object.keys(environment.plugins[pluginName].services)
          .reduce((srvList, srvName) => [
            ...srvList,
            {
              configName: srvName,
              ...environment.plugins[pluginName].services[srvName] // another shallow copy, but these should all be primitive anyway
            }
          ], [])
      }
    ], [])

  if (_.isEmpty(ctx.plugins)) {
    return Promise.reject(new Error(format(
      'Plugin "%s" not found in configuration for environment "%s".',
      ctx.plugin,
      environmentName
    )))
  }

  return Promise.resolve(ctx)
}

exports.createNewContext = createNewContext
exports.context = argv => {
  console.log(argv)
  // load `maya.json` if no other file is specified with `--config`
  if (!argv.config) {
    argv.config = './maya.json'
  }

  const config = fs.existsSync(argv.config)
    ? JSON.parse(fs.readFileSync(argv.config, 'utf-8'))
    : false

  if (!config) {
    return Promise.reject(new Error(
      'Could not find configuration file maya.json in the current directory.'
    ))
  }

  return createNewContext(argv, config)
}
