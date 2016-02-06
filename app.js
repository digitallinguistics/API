// node modules
require('./lib/utils');
const bodyParser = require('body-parser');
const config = require('./lib/config');
const cookieParser = require('cookie-parser');
// const credentials = require('./lib/credentials');
const http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<pre>${JSON.stringify(config, null, 2)}</pre>`);
}).listen(process.env.PORT);
