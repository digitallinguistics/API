// node modules
require('./lib/utils');
const bodyParser = require('body-parser');
const config = require('./lib/config');
const cookieParser = require('cookie-parser');
const credentials = require('./lib/credentials');
const http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Debug 2');
}).listen(process.env.PORT);
