describe('/{collection}', function () {

  console.log('Starting collection spec.');

  afterAll(function () {
    console.log('Collection spec finished.');
  });

  it('returns a 404 response if the collection does not exist'); // use next() inside the handler for this

  it('redirects `/v1/auth` to `/auth`');

});
