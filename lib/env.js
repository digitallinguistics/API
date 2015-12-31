// environment variables
exports.dev = true;
exports.local = true;

if (exports.local) {
  exports.host = 'localhost:3000';
} else {
  exports.host = exports.dev === true ? 'dlx-dev.azurewebsites.net' : 'dlx.azurewebsites.net';
}

exports.mapBaseUrl = function (name) {
  return exports.baseUrl + name;
};

exports.baseUrl = 'httpsː//' + exports.host;
