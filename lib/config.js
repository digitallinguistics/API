// environment variables
if (!process.env.WEBSITE_HOSTNAME) {
  global.env = 'local';
  exports.host = 'localhost:3000';
} else {

  if (process.env.WEBSITE_HOSTNAME === 'dlx-dev.azurewebsites.net') {
    global.env = 'development';
  } else if (process.env.WEBSITE_HOSTNAME === 'dlx.azurewebsites.net') {
    global.env = 'production';
  }

  exports.host = process.env.WEBSITE_HOSTNAME;

}

exports.baseUrl = '//' + exports.host;
exports.env = global.env;
exports.protocol = global.env === 'local' ? 'http' : 'https';
exports.url = exports.protocol + ':' + exports.baseUrl;

exports.mapBaseUrl = function (path) {
  return exports.baseUrl + path;
};

exports.mapUrl = function (path) {
  return exports.url + path;
};