// node modules
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const middleware = require('./lib/middleware');
const path = require('path');
const router = require('./lib/router');
const Socket = require('./lib/socket');

// set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
process.env.PORT = process.env.PORT || 3000;

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// API routing
router(app);

// catch-all error handlers
app.use((req, res, next) => res.error(404)); // eslint-disable-line
app.use((err, req, res, next) => res.error(JSON.stringify(err, null, 2))); // eslint-disable-line

// create a server and Socket.IO server
const server = http.createServer(app);
const io = require('socket.io')(server);

// listen on port
server.listen(app.get('port'), () => console.log(`Server started. Press Ctrl+C to terminate.
  Project:  dlx-api
  Port:     ${app.get('port')}
  Time:     ${new Date}
  Node:     ${process.version}
  Env:      ${process.env.NODE_ENV}`));

// Socket routing
io.origins('danielhieber.com');
io.on('connection', socket => Socket(io, socket));
