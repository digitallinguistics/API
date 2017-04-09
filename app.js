// load config file before loading other modules
const config = require('./lib/config');

// load dependencies
const auth       = require('./lib/auth');
const bodyParser = require('body-parser');
const express    = require('express');
const handlers   = require('./lib/handlers');
const helmet     = require('helmet');
const middleware = require('./lib/middleware');
const routers    = require('./lib/routers');
const server     = require('./lib/server');

const {
  authenticateToken,
  authRequest,
} = auth;

// initialize Express and routers
const app = express();             // create the Express app
const v0  = express.Router();      // create the Version 0.x router

// app settings
app.enable('trust proxy');         // trust the Azure proxy server
app.set('port', config.port);      // set port for the app

// middleware
app.use(helmet());                 // basic security features
app.use(express.static('public')); // routing for static files
app.use(middleware);               // custom middleware (logs URL)
app.use(bodyParser.json());        // parse JSON data in the request body
app.use(authenticateToken.unless({ // authenticate requests to the API
  path: [/auth/, /token/],         // don't authenticate OAuth routes
}));

// add routes for OAuth
app.get('/auth', authRequest);
app.post('/auth', authRequest);

// add routes to routers for each API version
routers.v0(v0);

// mount routers to their respective version paths
app.use(v0);                       // default routing
app.use('/v0', v0);

// generic error handlers
app.use(handlers.notFound);        // 404 error
app.use(handlers.errors);          // 500 error

server(app);                       // create the server

module.exports = app;              // export app for testing
