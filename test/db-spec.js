const assert = require('chai').assert;
const db = require('../lib/db');
const expect = require('chai').expect;

/* jshint expr: true */
describe('the database API (db.js)', function () {

  this.timeout(15000);

  before(function (done) {
    db.ready().then(() => {
      setTimeout(done, 2000);
    });
  });

  it('can create a document', function () {

    const text = {
      title: 'How the world began',
      phrases: [
        {
          transcription: 'waštʼunkʼu ʔasi',
          translation: 'one day a man'
        }
      ]
    };

    return db.create('texts', text, { createId: true })
    .then(res => {
      expect(res).to.be.an.instanceof(Object);
      expect(res).not.to.be.an.instanceof(Array);
      expect(Number.isInteger(+res.id)).to.be.true;
    }).catch(err => {
      console.error(err);
      assert.fail(err);
    });

  });

  it('can create multiple documents');

  it('can delete a document');

  it('can delete multiple documents');

  it('can get a document');

  it('can get multiple documents');

  it('can get a document by ID');

  it('can get multiple documents by ID');

  it('can get a user by service ID');

  it('can get multiple users by service ID');

  it('can get a user by email ID');

  it('can get multiple users by email ID');

  it('can upsert a new document');

  it('can upsert multiple new documents');

  it('can upsert an existing document');

  it('can upsert multiple existing documents');

});
