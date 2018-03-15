'use strict';

const format = require('util').format;
const context = require('./context');
const buildBackend = require('./backend/build');
const buildFrontend = require('./frontend/build');
const deployBackend = require('./backend/deploy');
const deployFrontend = require('./frontend/deploy');

function createDeploy(argv) {
  return context(argv)
    .then(buildBackend)
    .then(buildFrontend)
    .then(deployBackend)
    .then(deployFrontend);
}

module.exports = createDeploy;
