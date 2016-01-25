// node modules
const config = require('./config');
const credentials = require('./credentials');
const db = require('./db');
const User = require('./models/user');

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
  console.log('Requested URL: ' + req.url);
  next();
};

exports.manageLogins = (req, res, next) => {

  const resetCookie = userRid => {
    res.cookie('user', userRid, { maxAge: 14400000, signed: true });
  };

  req.loggedIn = (() => {
    if (req.signedCookies.user) {
      resetCookie(req.signedCookies.user);
      return true;
    } else if (req.headers.authorization) {
      db.getUser(decrypt(req.headers.authorization.replace(/(B|b)earer /, '')))
      .then(user => resetCookie(user.rid))
      .catch(err => r.res(err, null, res));
    } else {
      return false;
    }
  })();

  res.login = rid => resetCookie(rid);

  res.logout = () => {
    res.clearCookie('user');
    res.locals.user = {};
  };

  if (req.query.logout) {
    res.logout();
    res.redirect('/');
  } else if (req.signedCookies.user || req.headers.authorization) {
    db.getUser(req.signedCookies.user || decrypt(req.headers.authorization.replace(/(B|b)earer /, '')))
    .then(user => { res.locals.user = new User(user); next(); })
    .catch(err => r.res(err, null, res));
  } else {
    next();
  }

};

exports.authStatus = (req, res, next) => {

  if (!req.headers.authorization) {
    req.authStatus = 'missing';
  } else {
    const token = req.headers.authorization.replace(/(B|b)earer /, '');
    req.authStatus = res.locals.user.checkToken(token);
  }

  next();

};
