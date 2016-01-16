// node modules
var config = require('./config');
var db = require('./db');

exports.error404 = function (req, res) {
  res.sendStatus(404);
};

exports.error500 = (err, req, res) => {
  console.error(err);
  res.sendStatus(500);
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

  req.loggedIn = (() => {
    if (req.signedCookies.user) {
      res.cookie('user', req.signedCookies.user, { maxAge: 3660000, signed: true });
      return true;
    } else {
      return false;
    }
  })();

  res.login = (rid) => {
    res.cookie('user', rid, { maxAge: 3660000, signed: true });
  };

  res.logout = () => {
    res.clearCookie('user');
    res.locals.user = {};
  };

  if (req.query.logout) {
    res.logout();
  }

  if (req.signedCookies.user) {
    db.getUser(req.signedCookies.user)
    .then(user => { res.locals.user = user; next(); })
    .catch();
  } else {
    next();
  }
};
