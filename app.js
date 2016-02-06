// node modules
require('./lib/utils');
const bodyParser = require('body-parser');
const config = require('./lib/config');
const cookieParser = require('cookie-parser');
const credentials = require('./lib/credentials'); // TODO: remember to upload this with SFTP
const db = require('./lib/db');
const express = require('express');
const http = require('http');
const middleware = require('./lib/middleware');
if (global.env === 'local') { require('./lib/dev'); }

const app = express(); // initialize Express app

app.disable('x-powered-by'); // hide server information in the response
app.enable('trust proxy'); // trust the Azure proxy server
app.set('port', config.port); // set local port to 3000

// middleware
app.use(middleware.logUrl); // url logging for debugging
app.use(cookieParser(credentials.secret)); // parse cookies
app.use(express.static(__dirname + '/public')); // routing for static files
app.use(middleware.parser); // handles Content-Type header, Authorization header, and queries
app.use(bodyParser.urlencoded({ extended: false })); // parse form data
app.use(bodyParser.json()); // parse JSON data

// routing
require('./lib/router')(app);

// catch-all error handlers
app.use(middleware.error404);
app.use(middleware.error500);

const startServer = () => {

  // create a server
  const server = http.createServer(app);

  // listen on port
  /* jshint -W058 */
  server.listen(app.get('port'), () => {
    console.log(`
      Server started. Press Ctrl+C to terminate.
      Project:  dlx-api
      Port:     ${app.get('port')}
      Time:     ${new Date}
      Node:     ${process.version}
      Env:      ${global.env}`);
    });

  exports.end = () => server.close();

};

startServer();

if ((global.env == 'local' && require.main === module) || (global.env !== 'local')) {
  db.ready().then(startServer).catch(err => console.log(err));
} else {
  exports.start = () => db.ready().then(startServer).catch(err => console.log(err));
}
