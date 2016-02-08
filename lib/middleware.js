const ClientApp = require('./models/client-app');
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

  req.authScope = 'public';
  req.authStatus = 'missing';
  req.clientApp = null;
  req.loggedIn = false;
  req.user = null;

  const getUser = (id, idType, service) => {
    const processUser = user => {
      req.user = new User(user);
      if (req.user.lastActive > (Date.now() - 14400000)) {
        req.loggedIn = true;
        db.login(req.user.rid).then(result => {
          if (result.status == 200) { next(); }
          else { respond('Problem authenticating user.', null, res); }
        }).catch(err => respond(err, null, res));
      } else { next(); }
    };

    if (idType === 'rid') {
      db.get('users', id).then(processUser).catch(err => respond(err, null, res));
    } else if (idType === 'serviceId') {
      db.getById('users', id, { idType: 'serviceId', service: service }).then(processUser).catch(err => respond(err, null, res));
    } else {
      respond('Problem authenticating user.', 500, res);
    }
  };

  const verifyToken = token => {
    try {

      var key;
      const claims = jwt.decode(token);
      if (!(claims && claims.scope)) { respond('invalid_request', 401, res); }
      else {
        const adminOpts = {
          algorithms: ['RS256'],
          audience: 'https://api.digitallinguistics.org'
        };

        const userOpts = {
          algorithms: ['HS256'],
          audience: 'https://api.digitallinguistics.org',
          subject: claims.sub
        };

        const checkToken = () => {
          jwt.verify(token, key, (claims.scope === 'db' ? adminOpts : userOpts), (err, payload) => {
            if (err && err.name === 'TokenExpiredError') { req.authStatus = 'expired'; next(); }
            else if (err && err.name === 'JsonWebTokenError') { respond(err.message, 401, res); }
            else if (payload) {
              req.payload = payload;
              req.authStatus = 'valid';
              req.authScope = payload.scope;
              if (payload.scope === 'db' && ((!payload.sub) || (!payload.service))) {
                respond('Payload invalid. Payload must include both sub and service claims.', 401, res);
              } else if (payload.scope === 'db' && payload.sub !== 'dlx-org' && !payload.jti) {
                respond('JWT ID (state) claim missing.', 401, res);
              } else if (payload.scope === 'db' && payload.service) { getUser(payload.sub, 'serviceId', payload.service); }
              else if (payload.scope === 'db' && payload.sub === 'dlx-org') { next(); }
              else { getUser(payload.sub, 'rid'); }
            } else { respond('Problem checking DLx token.', 500, res); }
          });
        };

        if (claims.scope === 'db') { key = credentials.pubkey; checkToken(); }
        else if (claims.scope === 'user' && !claims.cid) { respond('User tokens must include a client ID claim.', 401, res); }
        else if (claims.scope === 'user') {
          db.get('apps', claims.cid).then(app => {
            req.clientApp = new ClientApp(app);
            key = req.clientApp.secret;
            checkToken();
          }).catch(err => respond(err, null, res));
        } else { respond('Invalid token. The `scope` claim is not a known value.', 401, res); }
      }

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

    if (!type.match(/^Bearer/i)) { respond('Authorization header must be of type `Bearer`.', 401, res); }
    else { req.authType = 'Bearer'; verifyToken(token); }

  } else if (req.signedCookies.dlx) {
    req.authStatus = 'invalid';
    verifyToken(req.signedCookies.dlx);
  } else if (req.query.token) {
    verifyToken(req.query.token);
  } else {
    next();
  }

};

/** URL logging for debugging */
exports.logUrl = (req, res, next) => {
  console.log('Requested URL:', req.url);
  next();
};
