const http = require('http');

const options = {
  hostname: 'localhost',
  method: 'POST',
  path: '/v1/lexicons',
  port: '3000'
};

const req = http.request(options, res => {
  console.log(res.statusCode);
});

req.end();
