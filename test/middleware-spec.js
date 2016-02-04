const app = require('../app');

describe('middleware', function () {

  console.log('Starting middleware tests.');

  beforeAll(function (done) {
    process.env.PORT = 3002;
    app.ready().then(() => {
      console.log('App ready.');
      this.db = require('../lib/db');
      done();
    }).catch(err => console.error(err));
  });

  afterAll(function () {
    app.closeServer();
  });

  it('returns a 404 response when the route cannot be found');
  it('returns a 405 response for the `apps` collection');
  it('returns a 405 response for DELETE requests to `users`');
  it('returns a 405 response for GET requests to `users`');
  it('returns a 405 response for PUT requests to `users`');
  it('returns a 500 response when the token is incorrectly formatted');

});
