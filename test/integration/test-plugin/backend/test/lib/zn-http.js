/* DO NOT MODIFY THIS FILE! IT'S FOR LOCAL USE ONLY! */
var requestify = require('requestify');

var headers = {
	baseurl: null,
	authorization: null,
	referer: null
};

headers['x-plugin'] = null;

var config = {};

try {

	config = require('../_runner/config.json');

} catch(err) {
	// file not found
}

module.exports = function(req) {

	var requestifyWrapper = function(method, url, options, data) {

		if (!options) {
			options = {};
		}

		if (!options.headers) {
			options.headers = {};
		}

		options.headers.Authorization = headers.authorization;
		
		if (headers['referer']) {
			options.headers.referer = headers['referer'];
		}
		
		if (headers['x-plugin']) {
			options.headers['X-Plugin'] = headers['x-plugin'];
		}
		
		if (method) {
			options.method = method;
		}

		if (data) {
			options.body = data;
		}

		if (!options.timeout) {
			options.timeout = 300000; // 5 minutes
		}

		return requestify.request(
			headers.baseurl + url,
			options
		);

	};

	var setHeader = function(header) {

		// Reset headers - use config if available; otherwise clear
		headers[header] = config[header] || null;

		if (!req.headers[header]) {
			// token already set, or req is missing header
			return false;
		}

		headers[header] = req.headers[header];

		if (['baseurl', 'authorization'].indexOf(header) !== -1) {
			delete req.headers[header];
		}

		return true;
		
	};

	this.parseHeaders = function() {
		for (header in headers) {
			setHeader(header);
		}

		return true;
	};

	this.request = function(url, options) {
		return requestifyWrapper(options.method, url, options);
	};

	this.get = function(url, options) {
		return requestifyWrapper('GET', url, options);
	};

	this.post = function(url, data, options) {
		return requestifyWrapper('POST', url, options, data);
	};

	this.put = function(url, data, options) {
		return requestifyWrapper('PUT', url, options, data);
	};

	this.del = function(url, options) {
		return requestifyWrapper('DELETE', url, options);
	};

	return this;
};
