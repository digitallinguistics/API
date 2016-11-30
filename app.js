const config = require('./lib/config');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const middleware = require('./lib/middleware');

// initialize Express
const app = express();

// app settings
app.enable('trust proxy'); // trust the Azure proxy server
app.set('port', config.port); // set port for the app

// middleware
app.use(helmet()); // basic security features
app.use(express.static('swagger')); // routing for static files
app.use(middleware); // custom middleware (logs URL)

// create a server
const server = http.createServer(app);

// generic error handler
server.on('error', err => console.error(err, err.stack));

// start the server listening
server.listen(config.port, () => {
  console.log(`\nServer started. Press Ctrl+C to terminate.\n
  Project:  dlx-api
  Env:      ${config.env}
  Port:     ${config.port}
  Node:     ${process.version}
  Time:     ${new Date}\n`);
});

module.exports = app;
