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

exports.mapBaseUrl = function (path) {
  return exports.baseUrl + path;
};
