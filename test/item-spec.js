describe('/{collection}/{itemId}', function () {

  console.log('Starting item spec.');

  afterAll(function () {
    console.log('Collection spec finished.');
  });

  it('returns a 404 response if the collection does not exist'); // use next() inside the handler for this
  it('returns an error if the item to upsert does not validate');

});
