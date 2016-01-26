// node modules
require('./lib/utils');
require('./lib/config');
require('./lib/responses');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const credentials = require('./lib/credentials');
const db = require('./lib/db');
const express = require('express');
const expressHandlebars = require('express-handlebars');
const http = require('http');
const middleware = require('./lib/middleware');

const app = express(); // initialize Express app
const handlebars = expressHandlebars.create(middleware.hbsOptions); // initialize Handlebars

app.disable('x-powered-by'); // hide server information in the response
app.enable('trust proxy'); // trust the Azure proxy server
app.engine('handlebars', handlebars.engine); // declare Handlebars engine
app.set('port', process.env.PORT || 3000); // set local port to 3000
app.set('view engine', 'handlebars'); // use Handlebars for templating

// middleware
app.use(middleware.logUrl); // url logging for debugging
app.use(express.static(__dirname + '/public')); // routing for static files
app.use(middleware.manageBody);
app.use(bodyParser.urlencoded({ extended: false })); // parse form data
app.use(bodyParser.json()); // parse JSON data
app.use(cookieParser(credentials.secret)); // cookie handling
app.use(middleware.manageLogin); // adds login/logout-related methods to req and res objects
app.use(middleware.manageQueries); // preformats the query parameters for easier use in handlers
app.use(middleware.authStatus); // determines the authentication status of the user

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

// generate CSS
require('./lib/less');

db.ready().then(() => {

  // start server
  const server = http.createServer(app);

  server.listen(app.get('port'), function () {
    console.log(`Server started. Press Ctrl+C to terminate.
      Port:   ${app.get('port')}
      Time:   ${new Date()}
      Node:   ${process.version}
      Env:    ${global.env}`);
    });

}).catch(err => console.error(err));


if (global.env === 'local') { require('./lib/dev'); }
