// middleware and options for Express app

// node modules
var config = require('./config');

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

exports.userInfo = (req, res, next) => {
  if (req.signedCookies.userName) {
    res.locals.userName = req.signedCookies.userName;
  }
  next();
};
