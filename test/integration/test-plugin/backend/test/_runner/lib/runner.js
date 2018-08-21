/* DO NOT MODIFY THIS FILE! IT'S FOR LOCAL USE ONLY! */
var express = require('express'),
	router = express.Router(),
	znHttp = require('../../lib/zn-http'),
	znFirebase = require('../../lib/zn-firebase'),
	generateFirebaseToken = require('./generate-firebase-token'),
	plugin = require('../../plugin');


router.all('/*', function main(req, res, next) {

	znHttp(req).parseHeaders();

	if (req.get('x-firebase-url')) {

		var firebaseToken = generateFirebaseToken(req);

		znFirebase(req.get('x-firebase-url'), firebaseToken);
		delete req.headers['x-firebase-url'];
	}

	var eventData = {
		request: {
			headers: req.headers,
			body: req.body,
			method: req.method,
			params: {
				workspaceId: req.pluginData.workspaceId,
				pluginNamespace: req.pluginData.pluginNamespace,
				pluginRoute: req.pluginData.pluginRoute
			},
			query: req.query,
			originalUrl: req.originalUrl
		},
		response: {
			set: function(field, value) {
				if (arguments.length === 2) {
					res.set(field, value);
				} else {
					// set multiple fields at once
					// by passing an object as the parameter
					res.set(field);
				}
				return this;
			},
			status: function(status) {
				res.status(status);
				return this;
			},
			send: function(body) {
				res.send(body);
				return this;
			},
			end: function() {
				res.end();
				return this;
			}
		}
	};

	plugin.run(eventData);
	
});

module.exports = router;
