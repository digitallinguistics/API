// load config file before loading other modules
const config = require('./lib/config');

// load dependencies
const authenticate = require('./lib/authenticate');
const bodyParser   = require('body-parser');
const express      = require('express');
const helmet       = require('helmet');
const middleware   = require('./lib/middleware');
const routers      = require('./lib/routers');
const server       = require('./lib/server');

// initialize Express and routers
const app = express();             // create the Express app
const v0 = express.Router();       // create the Version 0.x router

// app settings
app.enable('trust proxy');         // trust the Azure proxy server
app.set('port', config.port);      // set port for the app

// middleware
app.use(helmet());                 // basic security features
app.use(express.static('public')); // routing for static files
app.use(middleware);               // custom middleware (logs URL)
app.use(bodyParser.json());        // parse JSON data in the request body
app.use(authenticate);             // authenticate all requests to the API

// add routes
routers.v0(v0);

// mount routers to their respective API version paths
app.use(v0);                       // Latest
app.use('/v0', v0);                // v0.x

server(app);                       // create the server

module.exports = app;              // export app for testing
