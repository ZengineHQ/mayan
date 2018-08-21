var FirebaseTokenGenerator = require('firebase-token-generator');
var sha1 = require('sha1');

module.exports = function generateFirebaseToken(req) {

	var firebaseSecret = req.get('x-firebase-secret');

	if (!firebaseSecret) {
		return null;
	}

	delete req.headers['x-firebase-secret'];

	var tokenGenerator = new FirebaseTokenGenerator(firebaseSecret);

	var workspaces = {};

	if (req.pluginData.workspaceId) {
		workspaces[req.pluginData.workspaceId] = 'server';
	}

	var uuid = sha1(req.pluginData.workspaceId + req.pluginData.pluginNamespace + req.pluginData.pluginRoute);

	var data = {
		uid: uuid,
		workspaces: workspaces
	};

	return tokenGenerator.createToken(data);

};
