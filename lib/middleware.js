const credentials = require('./credentials');
const db = require('./db');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

/**
 * Returns a 404 response if no other routes are matched
 */
exports.error404 = (req, res) => {
  respond(null, 404, res);
};

/**
 * Returns a 500 response if uncaught internal errors occur
 */
exports.error500 = (err, req, res) => {
  console.error(err);
  res.status(500).send(`test stuff`);
  respond(err, null, res);
};

/**
 * Prehandling of the request object before being passed to the router/handlers
 * - Checks the authorization header and sets <code>req.authStatus</code> to either <code>missing</code>, <code>invalid</code>, or <code>valid</code>.
 * - Adds the <code>Content-Type</code> header if needed and not present
 * - Converts the <code>ids</code> parameter in the querystring to an array
 * - Returns error responses for unauthorized operation types
 */
exports.parser = (req, res, next) => {

  req.authStatus = 'missing';
  req.loggedIn = false;

  const getUser = rid => db.get('users', rid)
  .then(user => {
    req.authStatus = 'valid';
    req.user = new User(user);
    if (req.user.lastActive > (Date.now() - 14400000)) { req.loggedIn = true; }
    next();
  }).catch(err => respond(err, null, res));

  const verifyToken = token => {
    jwt.verify(token, credentials.secret, (err, payload) => {
      if (err && err.name === 'TokenExpiredError') { req.authStatus = 'expired'; next(); }
      else if (err && err.name === 'JsonWebTokenError') { respond(err.message, 401, res); }
      else if (payload) { getUser(payload.rid); }
      else { next(); }
    });
  };

  if ((req.method === 'PUT' || req.method === 'POST') && (req.headers['content-type'] !== 'application/json' && req.headers['content-type'] !== 'application/x-www-form-urlencoded')) {
    req.headers['content-type'] = 'application/json';
  }

  if (req.query.ids) {
    req.query.ids = req.query.ids.split(',');
  }

  if (req.headers.authorization) {

    req.authStatus = 'invalid';

    const header = req.headers.authorization.split(' ');
    const type = header[0];
    const token = header[1];

    if (type.match(/^(B|b)asic/)) {
      req.authType = 'Basic';
      const creds = new Buffer(token, 'base64').toString().split(':');
      const user = creds[0];
      const secret = creds[1];
      if (user === credentials.user && secret === credentials.secret) {
        req.authStatus = 'valid';
      }
      next();
    } else if (type.match(/^(B|b)earer/)) {
      req.authType = 'Bearer';
      verifyToken(token);
    } else { next(); }

  } else if (req.signedCookies.dlx) {
    req.authType = 'cookie';
    verifyToken(req.signedCookies.dlx);
  } else {
    next();
  }

};

/**
 * URL logging for debugging
 */
exports.logUrl = (req, res, next) => {
  console.log('\nRequested URL:', req.url);
  next();
};
