// middleware for Express app

// node modules
var baseUrl = require('./baseUrl');
var path = require('path');

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
      if (!this._sections) { this._sections = {}; }
      this._sections[name] = options.fn(this);
      return null;
    },

    static: function (path) {
      return baseUrl.map(path);
    }
  }
};

exports.lessOptions = {
  dest: '/css',
  pathRoot: path.join(__dirname, '../public'),
  preprocess: {
    less: function (src) {
      return "@baseUrl: '" + baseUrl.map('') + "';" + src;
    }
  }
};

exports.logUrl = function (req, res, next) {
  console.log('Requested URL: ' + req.url);
  next();
};
