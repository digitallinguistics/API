// node modules
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var credentials = require('./lib/credentials');
var express = require('express');
var expressHandlebars = require('express-handlebars');
var http = require('http');
var middleware = require('./lib/middleware');
require('./lib/config');
require('./lib/utils');

var app = express(); // initialize Express app
var handlebars = expressHandlebars.create(middleware.hbsOptions); // initialize Handlebars

app.disable('x-powered-by'); // hide server information in the response
app.enable('trust proxy'); // trust the Azure proxy server
app.engine('handlebars', handlebars.engine); // declare Handlebars engine
app.set('port', process.env.PORT || 3000); // set local port to 3000
app.set('view engine', 'handlebars'); // use Handlebars for templating

// middleware
app.use(middleware.logUrl); // url logging for debugging
app.use(express.static(__dirname + '/public')); // routing for static files
app.use(bodyParser.urlencoded({ extended: false })); // parse form data
app.use(cookieParser(credentials.secret)); // cookie handling
app.use(middleware.manageLogins); // adds login/logout-related methods to req and res objects

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

// generate CSS
require('./lib/less');

// start server
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log(`Server started. Press Ctrl+C to terminate.
  Port:   ${app.get('port')}
  Time:   ${new Date()}
  Node:   ${process.version}
  Env:    ${global.env}`);
});
