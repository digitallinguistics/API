// load config file before loading other modules
const config = require(`./lib/config`);

// load modules
const authenticate = require(`./lib/rest/middleware/authenticate`);
const bodyParser   = require(`body-parser`);
const createServer = require(`./lib/server`);
const createSocket = require(`./lib/socket`);
const error        = require(`./lib/rest/middleware/error`);
const errors       = require(`./lib/rest/errors`);
const express      = require(`express`);
const helmet       = require(`helmet`);
const limiter      = require(`./lib/rest/middleware/limit`);
const logger       = require(`./lib/rest/middleware/logger`);
const route        = require(`./lib/rest/router`);
const routeSocket  = require(`./lib/socket/router`);
const type         = require(`./lib/rest/middleware/type`);

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
route(v0);

// mount routers to their respective version paths
app.use(v0);
app.use(`/v0`, v0);

// add generic error handlers
app.use(errors.notFound);
app.use(errors.serverError);

const startServer = () => {

  const server = createServer(app);    // create the server
  const io     = createSocket(server); // create the socket

  // add routes to sockets
  routeSocket(io.of(`/`));
  routeSocket(io.of(`/v0`));

  app.io = io;                         // add IO to app (makes it available to request handlers)
  return app;                          // export app for testing

};

if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}
