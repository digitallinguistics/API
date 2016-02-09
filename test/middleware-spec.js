const http = require('http');

describe('middleware', function () {

  const makeRequest = (opts, handler) => {
    http.request(opts, res => {
      var data = '';
      res.on('data', chunk => data += chunk);
      res.on('error', err => fail(err));
      res.on('end', () => handler(JSON.parse(data), res));
    }).end();
  };

  const options = props => {
    const defaults = {
      hostname: 'localhost',
      method: 'GET',
      path: '/v1',
      port: 3000
    };
    Object.assign(defaults, props);
    return defaults;
  };

  beforeAll(function () {
    console.log('Middleware: starting');
  });

  afterAll(function () {
    console.log('Middleware: finished');
  });

  it('returns a 404 error when the collection does not exist', function (done) {
    const handler = result => {
      expect(result.status).toBe(404);
      done();
    };
    makeRequest(options({ path: '/hello' }), handler);
  });

});
