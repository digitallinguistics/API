const chai = require('chai');
const db = require('../lib/db');

const assert = chai.assert;
const expect = chai.expect;

/* jshint expr: true */
describe('the database API (db.js)', function () {

  this.timeout(10000);
  const results = [];

  before(function () {
    return db.ready().then(() => console.log('Database ready.'));
  });

  it('can create a document', function (done) {

    const text = {
      title: 'How the world began',
      phrases: [
        {
          transcription: 'waštʼunkʼu ʔasi',
          translation: 'one day a man'
        }
      ]
    };

    db.create('users', text, { createId: true })
    .then(res => {
      expect(res).to.be.instanceof(Object);
      expect(res).to.not.be.instanceof(Array);
      expect(res).to.have.property('id').that.satisfy(function (id) {
        return Number.isInteger(+id);
      });
      results.push(res);
      done();
    }).catch(err => assert.fail(err));

  });

  it('can create multiple documents', function (done) {

    const texts = [
      {
        title: 'How the Indian came',
        phrases: [
          {
            transcription: 'Wetkš hus naːnčaːkamankš weyt hi hokmiʔi.',
            translation: 'Then he left his brothers.'
          }
        ]
      },
      {
        title: 'ɔ́moísɛ́kɛ́ ɔ́sɔːkɛ́rɛ́tɛ́ chísɛ́ɛsɛ́',
        phrases: [
          {
            transcription: 'ɔ́moísɛ́kɛ́ ɔ́sɔːkɛ́rɛ́tɛ́ chísɛ́ɛsɛ́',
            translation: 'A girl who got married to dogs'
          }
        ]
      }
    ];

    db.create('texts', texts)
    .then(res => {
      expect(res).to.be.instanceof(Array);
      expect(res).to.have.length(2);
      expect(res[0]).to.have.property('id')
        .that.match(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      results.push(...res);
      done();
    }).catch(err => assert.fail(err));

  });

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
