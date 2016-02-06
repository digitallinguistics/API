// node modules
require('./lib/utils');
const http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello world!');
}).listen(process.env.PORT);

console.log('Server started.');
