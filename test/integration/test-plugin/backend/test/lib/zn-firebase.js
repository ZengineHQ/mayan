/* DO NOT MODIFY THIS FILE! IT'S FOR LOCAL USE ONLY! */
var Firebase = require('firebase');
var Ref;

module.exports = function(url, secret) {

	if (undefined !== Ref && !url) {
		return Ref;
	}

	if (!url) {
		console.log('Error firebase URL is a required param');
		return;
	}

	Ref = new Firebase(url);

	if (secret) {

		Ref.authWithCustomToken(secret, function(error, authData) {
			if (error) {
				console.log('Login Failed!', error);
			}
			return Ref;
		});
		
	} else {
		return Ref;
	}

}