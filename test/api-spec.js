describe('the API', function () {


  describe('/auth', function () {

    it('returns an error if the method is not GET');
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

  describe('/apps', function () {
    it('returns a 405 response if Basic auth is absent');
    it('returns a 401 response if Basic auth is present but invalid');
  });

  describe('/users', function () {
    it('returns a 405 response for non-POST requests with Bearer tokens');
  });

  describe('/{collection}/{itemId}', function () {
    it('returns a 404 response if the collection does not exist'); // use next() inside the handler for this
  });

  describe('/{collection}', function () {
    it('returns a 404 response if the collection does not exist'); // use next() inside the handler for this
  });

});
