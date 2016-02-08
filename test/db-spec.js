describe('the database API', function () {

  console.log('Starting database spec.');

  beforeAll(function (done) {
    this.db = require('../lib/db');
    this.collection = 'texts';
    this.users = [
      { id: 'me@example.com', firstName: 'John', lastName: 'Doe', services: { onedrive: '12345' } },
      { id: 'me@test.com', firstName: 'Jane', lastName: 'Doe', services: { onedrive: '67890' } }
    ];
    this.results = [];
    done();
  });

  afterAll(function (done) {

    const tasks = [];

    if (this.results && this.results.length > 0) {
      const deleteTexts = this.db.delete('texts', this.results.map(text => text._rid))
      .then(res => {
        if (res.every(response => response.status === 204)) { console.log('\nTexts deleted.'); }
        else { console.error('\nProblem deleting texts.'); }
      }).catch(err => console.error(err));
      tasks.push(deleteTexts);
    }

    if (this.users && this.users.length > 0 && this.users[0]._rid) {
      const deleteUsers = this.db.getById('users', this.users.map(user => user.id))
      .then(users => users.map(user => user._rid))
      .then(rids => this.db.delete('users', rids).then(res => {
        if (res.every(response => response.status === 204)) { console.log('\nUsers deleted.'); }
        else { console.error('\nProblem deleting users.'); }
      }));
      tasks.push(deleteUsers);
    }

    Promise.all(tasks).then(() => {
      console.log('Database spec finished.');
      done();
    }).catch(err => {
      console.error(err);
      console.log('Database spec finished.');
      done();
    });

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

    this.db.create(this.collection, text, { createId: true })
    .then(res => {
      expect(res instanceof Array).toBe(false);
      expect(Number.isInteger(+res.id)).toBe(true);
      this.results.push(res);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));

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

    this.db.create(this.collection, texts)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(2);
      expect(res[0].id).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      this.results.push(...res);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));

  });

  it('can get a document', function (done) {
    this.db.get(this.collection, this.results[1]._rid)
    .then(text => {
      expect(text).toEqual(this.results[1]);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can get multiple documents', function (done) {
    const rids = this.results.slice(1).map(text => text._rid);
    this.db.get(this.collection, rids)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(rids.length);
      expect(rids.includes(res[0]._rid)).toBe(true);
      expect(rids.includes(res[1]._rid)).toBe(true);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can get a document by ID', function (done) {
    this.db.getById(this.collection, this.results[0].id, { idType: 'id' })
    .then(text => {
      expect(text).toEqual(this.results[0]);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can get multiple documents by ID', function (done) {
    const ids = this.results.map(text => text.id);
    this.db.getById(this.collection, ids)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(this.results.length);
      expect(this.results).toContain(res[0]);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can upsert multiple existing documents', function (done) {
    this.results.forEach(text => text.speaker = 'John Smith');
    this.db.upsert(this.collection, this.results)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      res.forEach((text, i, arr) => {
        const orig = this.results.filter(item => item.id === text.id)[0];
        expect(orig).toBeDefined();
        expect(orig._rid).toEqual(text._rid);
        expect(text.speaker).toBe('John Smith');
        if (i === arr.length-1) { done(); }
      });
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can upsert a new document', function (done) {

    const text = {
      title: 'Jambo means hello',
      phrases: [
        { token: 'jambo', gloss: 'hello' },
        { token: 'kwa heri', gloss: 'goodbye' }
      ]
    };

    this.db.upsert(this.collection, text)
    .then(res => {
      expect(res).toBeDefined();
      expect(res instanceof Array).toBe(false);
      expect(res._rid).toBeDefined();
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));

  });

  it('can upsert multiple new documents', function (done) {

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

    this.db.upsert(this.collection, texts)
    .then(res => {
      expect(res).toBeDefined();
      expect(res instanceof Array).toBe(true);
      expect(res[1]._rid).toBeDefined();
      const titles = texts.map(text => text.title);
      expect(titles).toContain(res[0].title);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));

  });

  it('can upsert an existing document as a new document', function (done) {
    this.db.upsert(this.collection, this.results[0], { createId: true })
    .then(res => {
      expect(res instanceof Array).toBe(false);
      expect(res.speaker).toBe('John Smith');
      expect(res.title).toEqual(this.results[0].title);
      expect(res.id).not.toEqual(this.results[0].id);
      expect(res._rid).not.toEqual(this.results[0]._rid);
      this.results.push(res);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can delete a document', function (done) {
    this.db.delete(this.collection, this.results[2]._rid)
    .then(res => {
      expect(res.status).toBe(204);
      this.results.splice(2, 1);
      done(0);
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can delete multiple documents', function (done) {
    const ids = this.results.map(text => text._rid);
    this.db.delete(this.collection, ids)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.every(response => response.status === 204)).toBe(true);
      this.results.splice(0);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
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
    }).catch(err => {
      if (err.status == 409) { fail('\nTest user already exists.'); }
      else { fail(err); }
    });
  });

  it('returns a 409 error when creating a user whose email already exists', function (done) {
    this.db.create('users', this.users)
    .then(res => fail('Error not thrown. Received response:', res))
    .catch(err => {
      expect(err.status).toBe(409);
      done();
    });
  });

  it('can get a user by service ID', function (done) {
    const serviceId = this.users[0].services.onedrive;
    this.db.getById('users', serviceId, { id_type: 'service_id', service: 'onedrive' })
    .then(res => {
      expect(res instanceof Array).toBe(false);
      expect(res._rid).toEqual(this.users[0]._rid);
      expect(res.id).toEqual(this.users[0].id);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can get multiple users by service ID', function (done) {
    const serviceIds = this.users.map(user => user.services.onedrive);
    this.db.getById('users', serviceIds, { idType: 'serviceId', service: 'onedrive' })
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(this.users).toContain(res[0]);
      expect(this.users).toContain(res[1]);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can get multiple users by email ID', function (done) {
    const email = this.users[0].id;
    this.db.getById('users', email)
    .then(res => {
      expect(this.users).toContain(res);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can get multiple users by email ID', function (done) {
    const emails = this.users.map(user => user.id);
    this.db.getById('users', emails)
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(this.users).toContain(res[0]);
      expect(this.users).toContain(res[1]);
      done();
    }).catch(err => fail(JSON.stringify(err, null, 2)));
  });

  it('can log in a user', function (done) {
    this.db.login(this.users[0]._rid)
    .then(res => {
      expect(res.status).toEqual(200);
      this.db.get('users', this.users[0]._rid)
      .then(user => {
        expect(user.lastActive).toBeGreaterThan(Date.now() - 10000);
        done();
      }).catch(err => fail(err));
    }).catch(err => fail(err));
  });

  it('can log out a user', function (done) {
    this.db.logout(this.users[0]._rid)
    .then(res => {
      expect(res.status).toEqual(200);
      this.db.get('users', this.users[0]._rid)
      .then(user => {
        expect(user.lastActive).toBeLessThan(Date.now() - 10000);
        done();
      }).catch(err => fail(err));
    }).catch(err => fail(err));
  });

  it('can handle throttled requests (many requests in sequence)', function (done) {

    pending('This is a stress test that should only be run occasionally.');

    const lexEntries = Array(500).fill(null).map((item, i) => {
      return { id: i + '', token: 'jambo', gloss: 'hello' };
    });

    this.db.upsert('lexEntries', lexEntries)
    .then(res => {

      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(lexEntries.length);

      this.db.delete('lexEntries', res.map(lexEntry => lexEntry._rid))
      .then(res => {
        expect(res.every(response => response.status === 204)).toBe(true);
        done();
      }).catch(err => fail(JSON.stringify(err, null, 2)));

    }).catch(err => fail(JSON.stringify(err, null, 2)));

  }, 180000);

});
