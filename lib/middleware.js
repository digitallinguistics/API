const ClientApp = require('./models/client-app');
const db = require('./db');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

/** Returns a 404 response if no other routes are matched */
exports.error404 = (req, res) => {
  respond(null, 404, res);
};

/** Returns a 500 response if uncaught internal errors occur */
exports.error500 = (err, req, res) => {
  console.error(err);
  respond(err, null, res);
};

/** Preprocessing of the request object before being passed to the router/handlers. */
exports.parser = (req, res, next) => {

  req.authStatus = 'missing';
  req.clientApp = null;
  req.loggedIn = false;
  req.token = null;
  req.user = null;

  /** Sets the default <code>Content-Type</code> header if missing */
  if ((req.method === 'PUT' || req.method === 'POST') && (req.headers['content-type'] !== 'application/json' && req.headers['content-type'] !== 'application/x-www-form-urlencoded')) {
    req.headers['content-type'] = 'application/json';
  }

  /** Turns the <code>ids</code> parameter in the querystring into an array of IDs. */
  if (req.query.ids) {
    req.query.ids = req.query.ids.split(',');
  }

  /** Extracts the token if present. */
  if (req.headers.authorization || req.signedCookies.dlx || (req.method === 'POST' && req.body && req.url === '/oauth')) {
    req.authStatus = 'invalid';
    if (req.headers.authorization) {
      const header = req.headers.authorization.split(' ');
      const type = header[0];
      if (type.match(/bearer/i)) { req.token = header[1]; }
    } else if (req.signedCookies.dlx) { req.token = req.signedCookies.dlx; }
    else if (req.method === 'POST' && req.body && req.url === '/oauth') { req.token = req.body; }
  }

  /** Attempts to parse the token if present, and saves any errors to the request object. */
  if (req.token) {
    try {

      req.claims = jwt.decode(req.token);
      const tasks = [];

      /** Attempts to retrieve the claimed Client App */
      const getClientApp = rid => new Promise((resolve, reject) => {
        db.get('apps', rid).then(app => req.claims.clientApp = new ClientApp(app)).catch(reject);
      });

      /** Attempts to retrieve the claimed User */
      const getUser = rid => new Promise((resolve, reject) => {
        db.get('users', rid).then(user => req.claims.user = new User(user)).catch(reject);
      });

      if (req.claims.cid) { tasks.push(getClientApp(req.claims.cid)); }
      if (req.claims.sub) { tasks.push(getUser(req.claims.sub)); }

      Promise.all(tasks).then(next).catch(err => req.tokenError = jsonResponse(err));

    } catch (err) {
      if (err.name === 'TokenExpiredError') { req.authStatus = 'expired'; req.tokenError = jsonResponse('The access token is expired.', 419); }
      else if (err.name === 'JsonWebTokenError') { req.tokenError = jsonResponse(err.message, 401); }
      else { req.tokenError = jsonResponse(err, null); }
    }
  } else {
    next();
  }

};

/** URL logging for debugging */
exports.logUrl = (req, res, next) => {
  console.log('Requested URL:', req.url);
  next();
};
