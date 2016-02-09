const credentials = require('./credentials');
const jwt = require('jsonwebtoken');

/** Protects a route by requiring a properly-formatted Admin token to be present in the Authorization header. */
exports.requireAdminToken = (req, res, next) => {
  if (req.tokenError) { respond(req.tokenError, 401, res); }
  else if (!req.headers.authorization) { respond('Admin token must be present in the Authorization header.', 401, res); }
  else {
    try {
      const opts = {
        algorithms: ['RS256'],
        audience: 'https://api.digitallinguistics.org'
      };
      const payload = jwt.verify(req.token, credentials.pubkey, opts);
      const attrs = ['aud', 'exp', 'iat'];
      if (!attrs.every(attr => attr in payload)) { respond('invalid_request', 401, res); }
      else { req.authStatus = 'valid'; next(); }
    } catch (err) {
      if (err.name === 'TokenExpiredError') { respond('The access token is expired.', 419, res); }
      else if (err.name === 'JsonWebTokenError') { respond(err.message, 401, res); }
      else { respond(err, null, res); }
    }
  }
};

/** Protects a route by requiring a properly-formatted OAuth token to be present in the Authorization header. */
exports.requireOAuthToken = (req, res, next) => {
  if (req.tokenError) { respond(req.tokenError, 401, res); }
  else if (req.method !== 'POST') { respond('OAuth requests must use the POST method.', 405, res); }
  else if (!req.body) { respond('Access token must be present in the request body.', 401, res); }
  else {
    try {
      const opts = {
        algorithms: ['RS256'],
        audience: 'https://api.digitallinguistics.org'
      };
      const payload = jwt.verify(req.token, credentials.pubkey, opts);
      const attrs = ['aud', 'exp', 'iat', 'jti'];
      if (!attrs.every(attr => attr in payload)) { respond('invalid_request', 401, res); }
      else {
        req.clientApp = req.claims.clientApp;
        req.user = req.claims.user;
        req.authStatus = 'valid';
        next();
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') { respond('The access token is expired.', 419, res); }
      else if (err.name === 'JsonWebTokenError') { respond(err.message, 401, res); }
      else { respond(err, null, res); }
    }
  }
};

/** Protects a route by requiring a properly-formatted User token to be present in the Authorization header. */
exports.requireUserToken = (req, res, next) => {
  if (req.tokenError) { respond(req.tokenError, 401, res); }
  else if (!req.headers.authorization) { respond('Access token must be present in the Authorization header.', 401, res); }
  else {
    try {
      const opts = {
        algorithms: ['HS256'],
        audience: 'https://api.digitallinguistics.org',
        subject: req.claims.sub
      };
      const payload = jwt.verify(req.token, req.claims.clientApp.secret, opts);
      const attrs = ['aud', 'cid', 'exp', 'iat', 'sub'];
      if (
        !attrs.every(attr => attr in payload) ||
        payload.cid !== req.claims.clientApp._rid ||
        payload.sub !== req.claims.user._rid
      ) { respond('invalid_request', 401, res); }
      else {
        req.clientApp = req.claims.clientApp;
        req.user = req.claims.user;
        req.authStatus = 'valid';
        next();
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') { respond('The access token is expired.', 419, res); }
      else if (err.name === 'JsonWebTokenError') { respond(err.message, 401, res); }
      else { respond(err, null, res); }
    }
  }
};

/** Middleware that attempts to verify the User token but does not block the route. (Used for routes which require delayed verification.) */
exports.verifyUserToken = (req, res, next) => {
  if (req.tokenError) { next(); }
  else if (!req.headers.authorization) { req.tokenError = jsonResponse('Access token must be present in the Authorization header.', 401); }
  else {
    try {
      const opts = {
        algorithms: ['HS256'],
        audience: 'https://api.digitallinguistics.org',
        subject: req.claims.sub
      };
      const payload = jwt.verify(req.token, req.claims.clientApp.secret, opts);
      const attrs = ['aud', 'cid', 'exp', 'iat', 'sub'];
      if (
        !attrs.every(attr => attr in payload) ||
        payload.cid !== req.claims.clientApp._rid ||
        payload.sub !== req.claims.user._rid
      ) { req.tokenError = jsonResponse('invalid_request', 401); }
      else {
        req.clientApp = req.claims.clientApp;
        req.user = req.claims.user;
        if (req.user.lastActive > (Date.now() - 14400000)) { req.loggedIn = true; }
        req.authStatus = 'valid';
      }
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') { req.authStatus = 'expired'; req.tokenError = jsonResponse('The access token is expired.', 419); }
      else if (err.name === 'JsonWebTokenError') { req.tokenError = jsonResponse(err.message, 401); }
      else { req.tokenError = jsonResponse(err, null); }
      next();
    }
  }
};
