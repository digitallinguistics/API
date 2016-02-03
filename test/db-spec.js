describe('the database API', function () {

  beforeAll(function (done) {

    this.db = require('../lib/db');

    this.results = [];

    this.texts = [
      {
        title: 'How the world began',
        phrases: [
          {
            transcription: 'waštʼunkʼu ʔasi',
            translation: 'one day a man'
          }
        ]
      },
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

    this.db.ready().then(done);

  });

  it('can create a document', function (done) {
    this.db.create('users', this.texts[0], { createId: true })
    .then(res => {
      expect(res instanceof Object).toBe(true);
      expect(res instanceof Array).toBe(false);
      expect(Number.isInteger(+res.id)).toBe(true);
      done();
    }).catch(err => console.error(err));
  });

  it('can create multiple documents', function (done) {
    this.db.create('texts', this.texts)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(3);
      expect(res[0].id).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      done();
    }).catch(err => console.error(err));
  });

  it('can get a document');

  it('can get multiple documents');

  it('can get a document by ID');

  it('can get multiple documents by ID');

  it('can delete a document');

  it('can delete multiple documents');

  it('can get a user by service ID');

  it('can get multiple users by service ID');

  it('can get a user by email ID');

  it('can get multiple users by email ID');

  it('can upsert a new document');

  it('can upsert multiple new documents');

  it('can upsert an existing document');

  it('can upsert multiple existing documents');

  it('can handle many requests in sequence');

});
