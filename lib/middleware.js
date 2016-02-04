const credentials = require('./credentials');
const db = require('./db');

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
      const rid = decrypt(token);
      if (rid.status && rid.status == 400) {
        respond(rid, 401, res);
      } else {
        db.getUser(rid)
        .then(user => {
          req.authStatus = 'valid';
          req.user = user;
          next();
        }).catch(err => respond(err, null, res));
      }
    } else { next(); }
  } else { next(); }

};

/**
 * URL logging for debugging
 */
exports.logUrl = (req, res, next) => {
  console.log('Requested URL:', req.url);
  next();
};
