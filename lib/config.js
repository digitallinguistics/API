/**
* Sets a number of environment and config variables for use across the project
*/

const port = process.env.PORT || 3000;

const package = require('../package.json');

if (!process.env.WEBSITE_HOSTNAME) {
  global.env = 'local';
  exports.host = 'localhost' + port;
} else {
  if (process.env.WEBSITE_HOSTNAME === 'dlx-dev.azurewebsites.net') {
    global.env = 'development';
    exports.host = process.env.WEBSITE_HOSTNAME;
  } else if (process.env.WEBSITE_HOSTNAME === 'dlx-api.azurewebsites.net') {
    global.env = 'production';
    exports.host = 'api.digitallinguistics.org';
  }
}

/**
 * The protocol-relative URL for this app.
 * @type {string}
 */
exports.baseUrl = '//' + exports.host;

/**
 * The environment variable. Set to <code>local</code> on localhost, <code>development</code> on the dev/testing server, and <code>production</code> on the production server.
 * Uses global rather than process to ensure that the variable is consistent in a cluster
 * @type {string}
 */
exports.env = global.env;

/**
 * The
 * @type {[type]}
 */
exports.port = port;

/**
 * The protocol to use, depending on the app environment. Set to <code>http</code> on localhost, and <code>https</code> otherwise.
 * @type {string}
 */
exports.protocol = global.env === 'local' ? 'http' : 'https';

/**
 * The absolute URL for this app.
 * @type {string}
 */
exports.url = exports.protocol + ':' + exports.baseUrl;

/**
 * Maps a path to a protocol-relative URL (one that begins with <code>//</code> rather than <code>http://</code> or <code>https://</code>). This allows a browser to use whatever protocol is appropriate.
 * @type {function}
 * @param {string} path           The path to map, including the querystring or hash. Must include an initial <code>/</code>.
 * @returns {string}              Returns a protocol-relative URL for that path.
 */
exports.mapBaseUrl = path => exports.baseUrl + path;

/**
 * Maps a path to an absolute URL. The protocol of the URL is set according to the environment variable(<code>http</code> for localhost, <code>https</code> for server testing and production).
 * @param {string} path           The path to map, including the querystring or hash. Must include an initial <code>/</code>.
 * @type {string}                 Returns an absolute URL for that path.
 */
exports.mapUrl = path => exports.url + path;

/**
 * Provides access to the npm package.json configuration variables.
 * @type {object}
 */
exports.package = package;
