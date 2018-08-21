/* DO NOT MODIFY THIS FILE! IT'S FOR LOCAL USE ONLY! */
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var runner = require('./lib/runner');
var app = express();

app.use(bodyParser.json({ limit: '6mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '6mb'  }));

// make param data available to any requests that need it
[
	'workspaceId',
	'pluginNamespace',
	'pluginRoute'
].forEach(function(paramName) {
	app.param(paramName, function(req, res, next, paramValue) {
		if (req.pluginData === undefined) {
			req.pluginData = {};
		}

		req.pluginData[paramName] = paramValue;
		next();
	});
});

// main route
app.use('/workspaces/:workspaceId/:pluginNamespace/:pluginRoute', runner);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handler
// will print stacktrace
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);
  res.send({
    message: err.message
  });
});


module.exports = app;
