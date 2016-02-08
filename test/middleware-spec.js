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

  console.log('Starting middleware spec.');

  beforeAll(function (done) {
    this.apiUrl = `${config.url}/v1`;
    done();
  });

  afterAll(function () {
    console.log('Middleware spec finished.');
  });

  it('returns a 404 response when the route cannot be found', function (done) {
    const handler = data => {
      expect(data.status).toEqual(404);
      done();
    };
    const opts = {
      hostname: 'localhost',
      path: '/jambo',
      port: 3000
    };
    http.get(opts, handle(handler));
  });

  it('returns a 401 response when the Bearer token is incorrectly formatted', function (done) {

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
