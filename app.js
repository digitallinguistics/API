// node modules
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const middleware = require('./lib/middleware');

// set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
process.env.PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'localhost') { require('../credentials/dlx-api'); }

// initialize Express app
const app = express();

// app settings
app.disable('x-powered-by'); // hide server information in the response
app.enable('trust proxy'); // trust the Azure proxy server
app.set('port', process.env.PORT); // set local port to 3000

// middleware
app.use(middleware.log); // url logging for debugging
app.use(express.static(__dirname + '/public')); // routing for static files
app.use(bodyParser.json()); // parse JSON data

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

// create a server
const server = http.createServer(app);

// listen on port
/* jshint -W058 */
server.listen(app.get('port'), () => {
console.log(`Server started. Press Ctrl+C to terminate.
  Project:  dlx-api
  Port:     ${app.get('port')}
  Time:     ${new Date}
  Node:     ${process.version}
  Env:      ${process.env.NODE_ENV}`);
});
