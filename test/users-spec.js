describe('/users', function () {

  beforeAll(function () {
    console.log('Starting users spec.');
  });

  afterAll(function () {
    console.log('Users spec finished.');
  });

  it('returns a 405 response for non-POST requests with Bearer tokens');
  it('returns an error if the user information to upsert does not validate');

});
