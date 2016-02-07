const credentials = require('./credentials');
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

/**
 * Preprocessing of the request object before being passed to the router/handlers
 * All authentication happens here. Requests are never passed to the API handlers if the authentication is invalid.
 * Requests MAY be passed to the API handlers if authentication is missing or expired.
 */
exports.parser = (req, res, next) => {

  req.authScope = null;
  req.authStatus = 'missing';
  req.clientApp = null;
  req.loggedIn = false;
  req.user = null;

  const getUser = rid => db.get('users', rid)
  .then(user => {
    req.user = new User(user);
    if (req.user.lastActive > (Date.now() - 14400000)) {
      req.loggedIn = true;
      db.login(req.user.rid).then(result => {
        if (result.status == 201) { next(); }
      }).catch(err => respond(err, null, res));
    } else { next(); }
  }).catch(err => respond(err, null, res));

  const verifyToken = token => {
    try {

      var key;
      const claims = jwt.decode(token);

      const adminOpts = {
        algorithms: ['RS256'],
        audience: 'https://api.digitallinguistics.org',
        subject: 'dlx-org'
      };

      const userOpts = {
        algorithms: ['HS256'],
        audience: 'https://api.digitallinguistics.org',
        subject: claims.sub
      };

      const checkToken = () => {
        const payload = jwt.verify(token, key, claims.scope === 'admin' ? adminOpts : userOpts);
        req.authStatus = 'valid';
        req.authScope = payload.scope;
        if (payload.sub) { getUser(payload.sub); } else { next(); }
      };

      if (claims.scope === 'db') { key = credentials.secret; checkToken(); }
      else if (claims.scope === 'user') {
        db.get('apps', claims.cid).then(app => {
          req.clientApp = app;
          key = app.secret;
          checkToken();
        }).catch(err => respond(err, null, res));
      } else { throw new Error('Invalid token. The `scope` claim is not a known value.'); }

    } catch (err) {
      if (err.name === 'TokenExpiredError') { req.authStatus = 'expired'; next(); }
      else if (err.name === 'JsonWebTokenError') { respond(err.message, 401, res); }
      else { respond(err, null, res); }
    }
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

    if (!type.match(/^Basic/i)) { respond('Authorization header must be of type `Bearer`.'); }
    else { req.authType = 'Bearer'; verifyToken(token); }

  } else if (req.signedCookies.dlx) {
    req.authStatus = 'invalid';
    verifyToken(req.signedCookies.dlx);
  } else {
    next();
  }

};

/** URL logging for debugging */
exports.logUrl = (req, res, next) => {
  console.log('\nRequested URL:', req.url);
  next();
};
