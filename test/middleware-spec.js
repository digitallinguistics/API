const config = require('../lib/config');
const http = require('http');

const handle = handler => {
  return res => {
    var data = '';
    res.on('error', err => console.error(err));
    res.on('data', chunk => data += chunk);
    res.on('end', () => handler(JSON.parse(data)));
  };
};

describe('middleware', function () {

  beforeAll(function (done) {
    this.apiUrl = `${config.url}/v1`;
    done();
  });

  xit('returns a 404 response when the route cannot be found', function (done) {
    const handler = data => {
      expect(data.status).toEqual(404);
      done();
    };
    http.get(`${config.url}/jambo`, handle(handler));
  });

  xit('returns a 401 response when the Bearer token is incorrectly formatted', function (done) {

    const handler = data => {
      expect(data.status).toEqual(401);
      done();
    };

    const opts = {
      hostname: 'localhost',
      path: '/v1/texts',
      port: 3000,
      headers: { Authorization: 'Bearer a1b2c3d4e5' }
    };

    http.request(opts, handle(handler)).end();

  });

});
