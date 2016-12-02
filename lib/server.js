/* eslint-disable no-console */

const config = require('./config');
const http   = require('http');

// log app details to the console
const startup = () => {
  console.log(`\nServer started. Press Ctrl+C to terminate.\n
  Project:  dlx-api
  Env:      ${config.env}
  Port:     ${config.port}
  Node:     ${process.version}
  Time:     ${new Date}\n`);
};

module.exports = app => {

  // create a server
  const server = http.createServer(app);

  // generic error handler
  server.on('error', err => console.error(err, err.stack));

  // start the server
  server.listen(config.port, startup);

};
