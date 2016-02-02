const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const db = require('../lib/db');

const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiAsPromised);

/* jshint expr: true */
describe('the database API (db.js)', function () {

  this.timeout(5000);

  before(function (done) {
    db.ready().then(() => done());
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

    const res = db.create('texts', text, { createId: true });

    expect(res).to.eventually.be.an('object');
    expect(res).to.eventually.not.be.an('array');
    expect(res).to.eventually.have.property('id')
      .that.satisfy(function (str) { return Number.isInteger(+str); });
    done();

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

    const res = db.create('texts', texts);

    expect(res).to.eventually.be.instanceof(Array);
    expect(res).to.eventually.have.length(2);
    expect(res).to.eventually.have.property('id')
      .that.is.not.a('number');
    expect(res).to.eventually.have.property('id')
      .that.match(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
    done();

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
