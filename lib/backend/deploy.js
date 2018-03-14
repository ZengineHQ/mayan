// Deploy backend services
const format = require('util').format;
const request = require('request-promise');
const Promise = require('bluebird');

function createDeploy(ctx) {

  let deployBackend = function(backend) {
    console.log(format('Deploying backend %s/%d', backend.configName, backend.id));
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true);
      }, 2000);
    });
  }

  let deployPlugin = function(plugin) {
    return Promise.map(plugin.services, deployBackend, { concurrency: ctx.concurrency });
  }

  let deployEachPlugin = function() {
    return Promise.map(ctx.plugins, deployPlugin, { concurrency: 1 });
  }

  return deployEachPlugin().return(ctx);

}

module.exports = createDeploy;
