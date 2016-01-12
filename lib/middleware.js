// middleware and options for Express app

// node modules
var config = require('./config');

exports.error404 = function (req, res) {
  res.sendStatus(404);
};

exports.error500 = function (err, req, res) {
  console.error(err);
  res.sendStatus(500);
};

exports.hbsOptions = {
  defaultLayout: 'main',

  helpers: {
    section: function (name, options) {
      if (!this.sections) { this.sections = {}; }
      this.sections[name] = options.fn(this);
      return null;
    },

    baseUrl: function (path) {
      return config.mapBaseUrl(path);
    }
  }
};

exports.logUrl = function (req, res, next) {
  console.log('Requested URL: ' + req.url);
  next();
};
