const config = require('./config');
const credentials = require('./credentials');
const db = require('./db');

exports.error404 = (req, res) => {
  r.res(null, 404, res);
};

exports.error500 = (err, req, res) => {
  console.error(err);
  r.res(err, null, res);
};

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
      const creds = new Buffer(token, 'base64').toString().split(':');
      const user = creds[0];
      const secret = creds[1];
      if (user === credentials.user && secret === credentials.secret) {
        req.authStatus = 'valid';
      }
      next();
    } else if (type.match(/^(B|b)earer/)) {
      if (req.params.collection === 'apps') {
        r.res('Access to the Apps collection is not allowed.', 405, res);
      } else if (req.params.collection === 'users' && req.method !== 'POST') {
        r.res('DELETE, GET, and PUT methods are not allowed for the Users collection.', 405, res);
      } else {
        const rid = decrypt(token);
        db.getUser(rid)
        .then(user => {
          req.authStatus = 'valid';
          req.user = user;
          next();
        }).catch(err => r.res(err, null, res));
      }
    } else { next(); }
  } else { next(); }

};

exports.hbsOptions = {
  defaultLayout: 'main',

  helpers: {
    // don't use arrow functions here - need to retain value of `this`
    section: function (name, options) {
      if (!this.sections) { this.sections = {}; }
      this.sections[name] = options.fn(this);
      return null;
    },

    baseUrl: path => {
      return config.mapBaseUrl(path);
    }
  }
};

exports.logUrl = (req, res, next) => {
  console.log('Requested URL:', req.url);
  next();
};
