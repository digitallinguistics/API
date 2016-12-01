// load config file before loading other modules
const config = require('./lib/config');

// load dependencies
const authenticate = require('./lib/authenticate');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const middleware = require('./lib/middleware');
const router = require('./lib/routes');
const server = require('./lib/server');

// initialize Express
const app = express();

// app settings
app.enable('trust proxy');          // trust the Azure proxy server
app.set('port', config.port);       // set port for the app

// middleware
app.use(helmet());                  // basic security features
app.use(express.static('swagger')); // routing for static files
app.use(middleware);                // custom middleware (logs URL)
app.use(bodyParser.json());         // parse JSON data in the request body
app.use(authenticate);              // authenticate all requests to the API

router(app);                        // URL routing
server(app);                        // create the server

module.exports = app;               // export app for testing
