require('../lib/utils');

describe('the database API', function () {

  beforeAll(function (done) {

    this.db = require('../lib/db');
    this.collection = 'texts';

    this.users = [
      { id: 'me@example.com', firstName: 'John', lastName: 'Doe', services: { onedrive: '12345' } },
      { id: 'me@test.com', firstName: 'Jane', lastName: 'Doe', services: { onedrive: '67890' } }
    ];

    this.results = [];

    this.db.ready().then(() => {
      console.log('Database ready.');
      done();
    }).catch(err => console.error(err));

  });

  afterAll(function (done) {

    const rids = this.users.map(user => user._rid);

    const deleteUsers = this.db.delete('users', rids)
    .then(res => {
      if (res.every(response => response.status === 204)) { console.log('\nUsers deleted.'); }
      else { console.error('Problem deleting users.'); }
    }).catch(err => console.error('Error in afterAll:', err));

    // const deleteDocs = this.db.delete('lexEntries', this.results.map(lexEntry => lexEntry._rid));

    Promise.all([deleteUsers]).then(done).catch(err => console.error(err));

  });

  xit('can create a document', function (done) {

    const text = {
      title: 'How the world began',
      phrases: [
        {
          transcription: 'waštʼunkʼu ʔasi',
          translation: 'one day a man'
        }
      ]
    };

    this.db.create(this.collection, text, { createId: true })
    .then(res => {
      expect(res instanceof Object).toBe(true);
      expect(res instanceof Array).toBe(false);
      expect(Number.isInteger(+res.id)).toBe(true);
      this.results.push(res);
      done();
    }).catch(err => { fail(err); done(); });

  });

  xit('can create multiple documents', function (done) {

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

    this.db.create(this.collection, texts)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(2);
      expect(res[0].id).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      this.results.push(...res);
      done();
    }).catch(fail);

  });

  xit('can get a document', function (done) {
    this.db.get(this.collection, this.results[1]._rid)
    .then(text => {
      expect(text).toEqual(this.results[1]);
      done();
    }).catch(fail);
  });

  xit('can get multiple documents', function (done) {
    const rids = this.results.slice(1).map(text => text._rid);
    this.db.get(this.collection, rids)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(rids.length);
      expect(rids.includes(res[0]._rid)).toBe(true);
      expect(rids.includes(res[1]._rid)).toBe(true);
      done();
    }).catch(fail);
  });

  xit('can get a document by ID', function (done) {
    this.db.getById(this.collection, this.results[0].id, { idType: 'id' })
    .then(text => {
      expect(text).toEqual(this.results[0]);
      done();
    }).catch(fail);
  });

  xit('can get multiple documents by ID', function (done) {
    const ids = this.results.map(text => text.id);
    this.db.getById(this.collection, ids)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(this.results.length);
      expect(this.results).toContain(res[0]);
      done();
    }).catch(fail);
  });

  xit('can delete a document', function (done) {
    this.db.delete(this.collection, this.results[2]._rid)
    .then(res => {
      expect(res.status).toBe(204);
      this.results.splice(2, 1);
      done(0);
    }).catch(fail);
  });

  xit('can delete multiple documents', function (done) {
    const ids = this.results.map(text => text._rid);
    this.db.delete(this.collection, ids)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.every(response => response.status === 204)).toBe(true);
      this.results = [];
      done();
    }).catch(fail);
  });

  it('can create users with email IDs', function (done) {
    this.db.create('users', this.users)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(2);
      expect(res.map(user => user.id).includes(this.users[0].id)).toBe(true);
      expect(res.map(user => user.id).includes(this.users[1].id)).toBe(true);
      this.users.splice(0);
      this.users.push(...res);
      done();
    }).catch(fail);
  });

  xit('returns a 409 error when creating a user whose email already exists', function (done) {
    this.db.create('users', this.users)
    .then(res => fail('Error not thrown. Received response:', res))
    .catch(err => {
      expect(err.status).toBe(409);
      done();
    });
  });

  xit('can get a user by service ID', function (done) {
    const serviceId = this.users[0].services.onedrive;
    this.db.getById('users', serviceId, { id_type: 'service_id', service: 'onedrive' })
    .then(res => {
      expect(res instanceof Object).toBe(true);
      expect(res._rid).toEqual(this.users[0]._rid);
      expect(res.id).toEqual(this.users[0].id);
      done();
    }).catch(fail);
  });

  xit('can get multiple users by service ID', function (done) {
    const serviceIds = this.users.map(user => user.services.onedrive);
    this.db.getById('users', serviceIds, { idType: 'serviceId', service: 'onedrive' })
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(this.users).toContain(res[0]);
      expect(this.users).toContain(res[1]);
      done();
    }).catch(fail);
  });

  xit('can get multiple users by email ID', function (done) {
    const email = this.users[0].id;
    this.db.getById('users', email)
    .then(res => {
      expect(this.users).toContain(res);
      done();
    }).catch(fail);
  });

  xit('can get multiple users by email ID', function (done) {
    const emails = this.users.map(user => user.id);
    this.db.getById('users', emails)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(this.users).toContain(res[0]);
      expect(this.users).toContain(res[1]);
      done();
    }).catch(fail);
  });

  it('can upsert a new document');

  it('can upsert multiple new documents');

  it('can upsert an existing document');

  it('can upsert multiple existing documents');

  xit('can handle throttled requests (many requests in sequence)', function (done) {

    done();

    // const ids = Array(200).fill(null).map((item, i, arr) => arr[i] = i);
    // push created items to this.results for use in afterAll

  });

});
