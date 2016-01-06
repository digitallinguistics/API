var config = require('./config');
var fs = require('fs');
var less = require('less');
var path = require('path');

(function () {

  var convertLess = function (lessInput) {
    return new Promise(function (resolve, reject) {

      var lessOptions = {
        globalVars: { baseUrl: '"' + config.baseUrl + '"' }
      };

      if (global.env === 'production') { lessOptions.compress = true; }

      less.render(lessInput.less, lessOptions)
      .then(function (lessOutput) {
        resolve({ css: lessOutput.css, fileName: lessInput.fileName });
      })
      .catch(reject);

    });
  };

  var generateCssFile = function (cssData) {
    var newFileName = path.join(__dirname, '../public/css', cssData.fileName.replace('.less', '.css'));
    fs.writeFile(newFileName, cssData.css);
  };

  var getLessInput = function (fileName) {
    return new Promise(function(resolve, reject) {
      fs.readFile(path.join(__dirname, '../public/less', fileName), { encoding: 'utf8' }, function (err, lessData) {
        if (err) { reject(err); }
        resolve({ less: lessData, fileName: fileName });
      });
    });
  };

  var logErrors = function (err) {
    console.error(err);
  };

  // the path is relative to app.js's directory, since that's where this is called
  fs.readdir('public/less', function (err, fileNames) {
    if (err) { logErrors(err); }
    else {
      fileNames.forEach(fileName => {
        getLessInput(fileName)
        .then(convertLess)
        .then(generateCssFile)
        .catch(logErrors);
      });
    }
  });

})();
