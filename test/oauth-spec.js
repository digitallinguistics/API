describe('/oauth', function () {

  beforeAll(function () {
    console.log('OAuth: starting');
  });

  afterAll(function () {
    console.log('OAuth: finished');
  });

  // mock this by first making the auth request, then sending the expected oauth request that would follow
  // make the auth request in a beforeEach rather than the beforeAll

  it('returns a 401 response if the token is not in the body');
  it('returns a 401 response for invalid tokens');
  it('returns a 401 response if the JWT ID claim is missing');
  it('returns a 419 response for expired tokens');
  it('returns a 500 response if the state is invalid');
  it('returns an error if the sub claim is invalid');
  it('returns to the original redirect URI if the token is valid');

});
