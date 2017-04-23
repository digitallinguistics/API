/* eslint-disable no-console */

const config   = require('../config');
const http     = require('http');
const routeMap = require(`express-routemap`);

// log app details to the console
const startup = () => {
  console.log(`\nServer started. Press Ctrl+C to terminate.\n
  Project:  DLx API
  Env:      ${config.env}
  Port:     ${config.port}
  Node:     ${process.version}
  Time:     ${new Date}\n`);
};

module.exports = app => {
  const server = http.createServer(app);                    // create a server
  server.on('error', err => console.error(err, err.stack)); // generic error handler
  server.listen(config.port, startup);                      // start the server
  routeMap(app);                                            // log routes
  return server;
};
