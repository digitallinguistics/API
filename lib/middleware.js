// node modules
const config = require('./config');
const db = require('./db');
const User = require('./models/user');

exports.authStatus = (req, res, next) => {

  if (!req.headers.authorization) {
    req.authStatus = 'missing';
  } else {
    const token = req.headers.authorization.replace(/(B|b)earer /, '');
    req.authStatus = res.locals.user.checkToken(token);
  }

  next();

};

exports.error404 = (req, res) => {
  r.res(null, 404, res);
};

exports.error500 = (err, req, res) => {
  console.error(err);
  r.res(err, null, res);
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

exports.manageBody = (req, res, next) => {
  if (req.method === 'PUT' && req.headers['content-type'] !== 'application/json') {
    req.headers['content-type'] = 'application/json';
  }
  next();
};

exports.manageLogin = (req, res, next) => {

  const resetCookie = userRid => {
    res.cookie('user', userRid, { maxAge: 14400000, signed: true });
  };

  res.logout = () => {
    res.clearCookie('user');
    res.locals.user = {};
  };

  res.login = rid => resetCookie(rid);

  if (req.query.logout) {
    res.logout();
    req.loggedIn = false;
    res.redirect('/');
  } else if (req.signedCookies.user || req.headers.authorization) {
    const rid = req.headers.authorization ? decrypt(req.headers.authorization.replace(/(B|b)earer /, '')) : req.signedCookies.user;
    db.getUser(rid)
    .then(user => {
      resetCookie(req.signedCookies.user);
      res.locals.user = new User(user);
      req.loggedIn = true;
      next();
    })
    .catch(err => r.res(err, null, res));
  } else {
    req.loggedIn = false;
    next();
  }

};

exports.manageQueries = (req, res, next) => {
  if (req.query.ids) { req.query.ids = req.query.ids.split(','); }
  next();
};
