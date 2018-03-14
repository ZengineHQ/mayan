//  Deploy frontend plugins
const format = require('util').format;
const request = require('request-promise');
const Promise = require('bluebird');

function createDeploy(ctx) {

  let deployFrontend = function(frontend) {
    console.log(format('Deploying frontend %s/%d', frontend.configName, frontend.id));
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true);
      }, 2000);
    });
  }

  let deployEachPlugin = function() {
    return Promise.map(ctx.plugins, deployFrontend, { concurrency: ctx.concurrency });
  }

  return deployEachPlugin().return(ctx);

}

module.exports = createDeploy;
