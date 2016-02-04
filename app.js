// node modules
require('./lib/utils');
require('./lib/config');
const bodyParser = require('body-parser');
const db = require('./lib/db');
const express = require('express');
const http = require('http');
const middleware = require('./lib/middleware');
if (global.env === 'local') { require('./lib/dev'); }

const app = express(); // initialize Express app

app.disable('x-powered-by'); // hide server information in the response
app.enable('trust proxy'); // trust the Azure proxy server
app.set('port', process.env.PORT || 3000); // set local port to 3000

// middleware
app.use(middleware.logUrl); // url logging for debugging
app.use(express.static(__dirname + '/public')); // routing for static files
app.use(middleware.parser); // handles Content-Type header, Authorization header, and queries
app.use(bodyParser.urlencoded({ extended: false })); // parse form data
app.use(bodyParser.json()); // parse JSON data

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

// create a server
const server = http.createServer(app);

// closes the server
const closeServer = () => server.close();

// starts the server
const startServer = () => {
  server.listen(app.get('port'), () => {
    console.log(`
      Server started. Press Ctrl+C to terminate.
      Project:  dlx-api
      Port:     ${app.get('port')}
      Time:     ${new Date()}
      Node:     ${process.version}
      Env:      ${global.env}`);
  });
};

// exports server start/close functionality
exports.closeServer = closeServer;
exports.startServer = startServer;

if ((global.env === 'local' && require.main === module) || (global.env !== 'local')) {
  // initialize the DocumentDB database and start the server
  db.ready().then(startServer).catch(err => console.error(err));
} else {
  // export a function to initialize the DocumentDB database and start the server
  exports.ready = () => db.ready().then(startServer).catch(err => console.error(err));
}
