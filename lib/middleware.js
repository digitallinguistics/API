// middleware for Express app

// node modules
var baseUrl = require('./baseUrl');
var fs = require('fs');
var less = require('less');
var path = require('path');

exports.compileLess = function () {

  var logErrors = function (err) {
    console.error(err);
    throw new Error(err);
  };

  var generateCss = function (files) {

    var convertLess = function (lessInput) {

      var options = {
        compress: true,
        globalVars: {
          baseUrl: '\"' + baseUrl.map('') + '\"'
        }
      };

      return less.render(lessInput, options);

    };

    var getLess = function (filepath) {
      return new Promise(function (resolve, reject) {
        fs.readFile(path.join(__dirname, '../public/less/', filepath), { encoding: 'utf8' }, function (err, data) {
          if (err) { reject(err); }
          else if (data) { resolve(data); }
        });
      });
    };


    files.forEach(file => {

      var writeCssFile = function (lessOutput) {
        return new Promise(function (resolve, reject) {

          var filepath = path.join(__dirname, '../public/css/', file.replace(/.less$/, '.css'));

          fs.writeFile(filepath, lessOutput.css, function (err) {
            if (err) { reject(err); }
            else if (!err) { resolve(); }
          });

        });
      };

      getLess(file)
        .then(convertLess)
        .then(writeCssFile)
        .catch(logErrors);
    });

  };

  var readLessDir = function () {
    return new Promise(function (resolve, reject) {
      fs.readdir(path.join(__dirname, '../public/less'), function (err, files) {
        if (err) { reject(err); }
        else if (files) { resolve(files); }
      });
    });
  };

  readLessDir()
    .then(generateCss)
    .catch(logErrors);

};

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

    baseUrl: function (path) {
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
