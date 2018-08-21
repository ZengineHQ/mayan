var express = require('express'),
	router = express.Router();
	main = require('../lib/main');

router.all('*', function(req, res, next) {
	main(req, res);
});

module.exports = router;
