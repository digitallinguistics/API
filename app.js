const config = require('./lib/config');
const express = require('express');
const helmet = require('helmet');
const middleware = require('./lib/middleware');
const router = require('./lib/router');
const server = require('./lib/server');

// initialize Express
const app = express();

// app settings
app.enable('trust proxy'); // trust the Azure proxy server
app.set('port', config.port); // set port for the app

// middleware
app.use(helmet()); // basic security features
app.use(express.static('swagger')); // routing for static files
app.use(middleware); // custom middleware (logs URL)

router(app); // URL routing
server(app); // create the server

// export app for testing
module.exports = app;
