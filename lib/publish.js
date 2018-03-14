// Publish plugins
const format = require('util').format;
const request = require('request-promise');
const context = require('./context');
const buildBackend = require('./backend/build');
const buildFrontend = require('./frontend/build');
const deployBackend = require('./backend/deploy');
const deployFrontend = require('./frontend/deploy');
const Promise = require('bluebird');
const _ = require('lodash');

function publish(ctx) {

  let publishOne = function(plugin) {
    console.log(format('Publishing %s/%d', ctx.plugin, plugin.id));
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true);
      }, 5000);
    });
  }

  return Promise.map(ctx.plugins, publishOne, { concurrency: 1 });

  // let endpoint = '/plugins/' + pluginId;
  //
  // let pluginId = 123;
  //
  // let options = {
  //   url: ctx.apiUrl + '/plugins/' + pluginId,
  //   method: 'POST',
  //   headers: {
  //     authorization: 'Bearer ' + ctx.accessToken
  //   },
  //   json: true,
  //   body: {
  //     publish: true
  //   }
  // };
  //
  // return request(options);

}

function createPublish(argv) {
  return context(argv)
    .then(buildBackend)
    .then(buildFrontend)
    .then(deployBackend)
    .then(deployFrontend)
    .then(publish);
}

module.exports = createPublish;
