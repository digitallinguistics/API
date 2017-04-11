// load config file before loading other modules
const config = require('./lib/config');

// load dependencies
const authenticate = require('./lib/middleware/authenticate');
const bodyParser   = require('body-parser');
const error        = require('./lib/middleware/error');
const express      = require('express');
const helmet       = require('helmet');
const logger       = require('./lib/middleware/logger');
const passport     = require('./lib/middleware/passport');
const routers      = require('./lib/routers');
const server       = require('./lib/server');

// initialize Express and routers
const app = express();             // create the Express app
const v0  = express.Router();      // create the Version 0.x router

// app settings
app.enable('trust proxy');         // trust the Azure proxy server
app.set('port', config.port);      // set port for the app

// middleware
app.use(helmet());                 // basic security features
app.use(bodyParser.json());        // parse JSON data in the request body
app.use(express.static('public')); // routing for static files
app.use(passport.initialize());    // initialize Passport
app.use(error);                    // adds res.error method to response
app.use(logger);                   // custom middleware (logs URL)
app.use(authenticate.unless({      // authenticate requests to the API
  path: [                          // don't authenticate OAuth or test routes
    /auth/,
    /oauth/,
    /test/,
    /token/,
  ],
}));

// add routes to routers
routers.v0(v0);

// mount routers to their respective version paths
app.use(v0);                       // default routing
app.use('/v0', v0);

// add generic routes and error handlers (must come after other routes)
routers.common(app);

server(app);                       // create the server
module.exports = app;              // export app for testing
