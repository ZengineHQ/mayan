const format = require('util').format;
const fs = require('fs');
const _ = require('lodash');

function getDefaultEnvName(ctx) {

  if (!ctx.environments) {
    return Promise.reject('Missing environments configuration file');
  }

  let name = false;

  _.forEach(ctx.environments, function(v, k) {
    if (!name && v.default === true) {
      name = k;
    }
  });

  return name;

}

function getEnv(ctx, env) {
  return _.get(ctx, 'environments.' + env);
}

function createContext(ctx) {

  if (_.isEmpty(ctx)) {
    return Promise.resolve(ctx);
  }

  // load `maya.json` if not specified with `--config`

  if (!ctx.config) {

    ctx.config = './maya.json';

    let config = fs.existsSync(ctx.config)
      ? JSON.parse(fs.readFileSync(ctx.config, 'utf-8'))
      : false;

    if (!config) {
      return Promise.reject('Could not find configuration file maya.json in the current directory');
    }

    ctx = _.merge(ctx, config);

  }

  // set an array of plugins and backend services that build, deploy and publish

  let environmentName = ctx.env ? ctx.env : getDefaultEnvName(ctx);

  if (!environmentName) {
    return Promise.reject('Unknow environment, please set in maya.json or pass using the --env argument.');
  }

  let environment = _.get(ctx.environments, environmentName);

  if (!environment) {
    return Promise.reject(format('Invalid environment name "%s".', environmentName));
  }

  ctx.plugins = environment.plugins;

  if (ctx.plugin !== '*') {
    ctx.plugins = [_.merge({ configName: ctx.plugin }, _.get(ctx.plugins, ctx.plugin))];
  }

  if (_.isEmpty(ctx.plugins)) {
    return Promise.reject(format('Plugin "%s" not found in configuration for environment "%s"', ctx.plugin, environmentName));
  }

  // convert ctx.plugins and ctx.plugins.*.services to array

  let plugins = [];

  _.forEach(ctx.plugins, function(plugin, name) {
    services = [];
    _.forEach(plugin.services, function(service, name) {
      services.push(_.merge(service, { configName: name }));
    });
    plugin.services = services;
    if (!plugin.configName) {
      plugin.configName = name;
    }
    plugins.push(plugin);
  });

  ctx.plugins = plugins;

  return Promise.resolve(ctx);

}

module.exports = createContext;
