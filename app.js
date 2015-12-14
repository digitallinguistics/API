// node modules
var express = require('express');
var expressHandlebars = require('express-handlebars');
var http = require('http');
var less = require('less-middleware');
var middleware = require('./lib/middleware');


// initialize Express app & Handlebars
var app = express();
var handlebars = expressHandlebars.create(middleware.hbsOptions);

app.disable('x-powered-by');
app.enable('trust proxy');
app.engine('handlebars', handlebars.engine);
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'handlebars');

// middleware
app.use(middleware.logUrl); // url logging for debugging
app.use(less('/less', middleware.lessOptions)); // routing for LESS files
app.use(express.static(__dirname + '/public')); // routing for static files

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

// start server
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log('Server started on port ' + app.get('port') + ' at ' + new Date() + '. Press Ctrl+C to terminate.');
});
