// load config file before loading other modules
const config = require(`./lib/config`);

// load modules
const authenticate = require(`./lib/middleware/authenticate-rest`);
const bodyParser   = require(`body-parser`);
const createServer = require(`./lib/modules/server`);
const createSocket = require(`./lib/modules/socket`);
const error        = require(`./lib/middleware/rest-error`);
const errors       = require(`./lib/routers/error-router`);
const express      = require(`express`);
const helmet       = require(`helmet`);
const limiter      = require(`./lib/middleware/limit`);
const logger       = require(`./lib/middleware/logger`);
const routes       = require(`./lib/routers/rest-router`);
const socket       = require(`./lib/routers/socket-router`);
const type         = require(`./lib/middleware/type`);

// initialize Express and routers
const app = express();               // create the Express app
const v0  = express.Router();        // create the Version 0.x router

// app settings
app.enable(`trust proxy`);           // trust the Azure proxy server
app.set(`port`, config.port);        // set port for the app

// middleware
app.use(helmet());                   // basic security features
app.use(limiter);                    // rate limiting
app.use(bodyParser.json());          // parse JSON data in the request body
app.use(express.static(`public`));   // routing for static files
app.use(error);                      // adds res.error method to response
app.use(logger);                     // custom middleware (logs URL)
app.use(type);                       // set req.type
app.use(authenticate.unless({        // authenticate requests to the API
  path: [/\/test\//],                // don't authenticate test routes
}));

// add routes to routers
routes(v0);

// mount routers to their respective version paths
app.use(v0);
app.use(`/v0`, v0);

// generic error handlers
errors(app);

const server = createServer(app);    // create the server
const io     = createSocket(server); // create the socket

// create a socket for each version namespace
socket(io);
socket(io.of(`/v0`));

module.exports = app;                // export app for testing
