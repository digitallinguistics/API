// node modules
var express = require('express');
var expressHandlebars = require('express-handlebars');
var http = require('http');
var middleware = require('./lib/middleware');

var app = express(); // initialize Express app
var handlebars = expressHandlebars.create(middleware.hbsOptions); // initialize Handlebars

app.disable('x-powered-by');
app.enable('trust proxy');
app.engine('handlebars', handlebars.engine);
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'handlebars');

// middleware
app.use(middleware.logUrl); // url logging for debugging
app.use(express.static(__dirname + '/public')); // routing for static files

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

// compile LESS files
middleware.compileLess();

// start server
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log('Server started on port ' + app.get('port') + ' at ' + new Date() + '. Press Ctrl+C to terminate.');
});
