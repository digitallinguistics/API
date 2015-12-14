  // environment variables
exports.dev = true;
exports.local = false;

if (exports.local) {
  exports.host = 'localhost:3000';
} else {
  exports.host = exports.dev === true ? 'dlx-dev.azurewebsites.net' : 'dlx.azurewebsites.net';
}

exports.map = function (name) {
  return exports.url + name;
};

exports.url = 'http://' + exports.host;
