// node modules
require('./lib/utils');
const bodyParser = require('body-parser');
const config = require('./lib/config');
const http = require('http');

http.createServer(function (req, res) {
  console.log('Debug 1');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello world!');
}).listen(process.env.PORT);

console.log('Server started. Debug 1.');
