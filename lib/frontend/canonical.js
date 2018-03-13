const _ = require('lodash');
const Promise = require("bluebird");
const mkdirp = Promise.promisify(require('mkdirp'));

const createPluginDirectory = async (rootDirectory, pluginName) => {
    return mkdirp(_.join([rootDirectory, 'maya_build', 'canonical', pluginName], '/'));
};

const build = async (rootDirectory, pluginName) => {
    await createPluginDirectory(rootDirectory, pluginName);
};

module.exports = {
    build: build,
};