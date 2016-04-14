// node modules
require('./lib/config');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const IO = require('socket.io');
const middleware = require('./lib/middleware');
const path = require('path');
const router = require('./lib/router');
const socket = require('./lib/socket');

// initialize Express app
const app = express();

// app settings
app.disable('x-powered-by'); // hide server information in the response
app.enable('trust proxy'); // trust the Azure proxy server
app.set('port', process.env.PORT); // set local port to 3000

// middleware
app.use(express.static(path.join(__dirname, '/public'))); // routing for static files
app.use(bodyParser.json()); // parse JSON data
app.use(middleware); // various middleware functions

// expose a route for a test page
if (process.env.NODE_ENV === 'localhost') {
  app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, './public/test.html'));
  });
}

// API routing
router(app);

// catch-all error handlers
app.use((req, res, next) => res.error(404)); // eslint-disable-line
app.use((err, req, res, next) => res.error(JSON.stringify(err, null, 2))); // eslint-disable-line

// create a server
const server = http.createServer(app);

// listen on port
server.listen(app.get('port'), () => console.log(`Server started. Press Ctrl+C to terminate.
  Project:  dlx-api
  Port:     ${app.get('port')}
  Time:     ${new Date}
  Node:     ${process.version}
  Env:      ${process.env.NODE_ENV}`));

// create a socket
const io = IO(server, {
  transports: ['websocket', 'xhr-polling']
});

// socket routing
socket(io);
