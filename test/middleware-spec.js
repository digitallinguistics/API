const config = require('../lib/config');
const http = require('http');

const handle = handler => {
  return res => {
    var data = '';
    res.on('error', err => console.error(err));
    res.on('data', chunk => data += chunk);
    res.on('end', () => handler(data));
  };
};

describe('middleware', function () {

  beforeAll(function (done) {
    this.baseUrl = `http://localhost:${config.port}`;
    done();
  });

  it('returns a 404 response when the route cannot be found', function (done) {

    const handler = data => {
      console.log(data);
      expect(data.status).toEqual(404);
      done();
    };

    http.get(`${this.baseUrl}/jambo`, handle(handler));

  });

  it('returns a 405 response for the `apps` collection');
  it('returns a 405 response for DELETE requests to `users`');
  it('returns a 405 response for GET requests to `users`');
  it('returns a 405 response for PUT requests to `users`');
  it('returns a 500 response when the token is incorrectly formatted');

});
