const app = require('../app');

describe('the API', function () {


  beforeAll(function (done) {
    app.ready().then(() => {
      console.log('App ready.');
      this.db = require('../lib/db');
      done();
    }).catch(err => console.error(err));
  });


  describe('GET /auth', function () {

    it('returns an error when missing the `client_id` parameter');
    it('returns an error when missing the `redirect_uri` parameter');
    it('returns an error when missing the `response_type` parameter');
    it('returns an error if the client app is not registered');
    it('renders the login page if the user is not logged in');
    xit('description', function (done) {
      // TODO: the state parameter should be included in the response querystring
      // the DLx token should be included in the response querystring
      done();
    });

  });


});
