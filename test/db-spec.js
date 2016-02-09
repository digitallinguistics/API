const db = require('../lib/db');

describe('the database API', function () {

  beforeAll(function () {
    console.log('Database: starting');
  });

  afterAll(function () {
    console.log('\nDatabase: finished');
  });

  it('can create a document', function (done) {
    db.create('texts', { hello: 'world' })
    .then(text => {
      expect(text instanceof Array).toBe(false);
      expect(text.hello).toBe('world');
      done();
    }).catch(err => fail(err));
  });

  it('can create multiple documents', function (done) {
    const texts = [
      { title: 'jambo dunia' },
      { title: 'hola mundo' },
      { title: 'hello world' }
    ];
    db.create('texts', texts).then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toEqual(texts.length);
      const titles = texts.map(text => text.title);
      res.forEach(text => {
        expect(titles.includes(text.title)).toBe(true);
      });
      done();
    }).catch(err => fail(err));
  });

  it('can get a document', function (done) {
    db.create('texts', { title: 'How the world began' })
    .then(text => db.get('texts', text._rid))
    .then(res => {
      expect(res instanceof Array).toBe(false);
      expect(res.title).toBe('How the world began');
      done();
    }).catch(err => fail(err));
  });

  it('can get a document by ID', function (done) {
    db.upsert('texts', { id: '999', title: 'A girl who got married to dogs' })
    .then(text => db.getById('texts', text.id))
    .then(res => {
      expect(res instanceof Array).toBe(false);
      expect(res.id).toBe('999');
      expect(res.title).toBe('A girl who got married to dogs');
      done();
    }).catch(err => fail(err));
  });

  it('can get multiple documents by ID', function (done) {
    const texts = [
      { id: '1000', title: 'First title' },
      { id: '1001', title: 'Second title' }
    ];
    const ids = ['1000', '1001'];
    db.upsert('texts', texts)
    .then(() => db.getById('texts', ids))
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(res.length).toBe(2);
      expect(ids).toContain(res[0].id);
      expect(ids).toContain(res[1].id);
      done();
    }).catch(err => fail(err));
  });

  it('can upsert an existing document', function (done) {
    const text = { id: '1002', title: 'Deja Vu' };
    db.upsert('texts', text)
    .then(() => db.upsert('texts', text))
    .then(res => {
      expect(res.id).toEqual(text.id);
      done();
    }).catch(err => fail(err));
  });

  it('can upsert multiple existing documents', function (done) {
    const texts = [
      { id: '1000', title: 'New title 1' },
      { id: '1001', title: 'New title 2' },
      { id: '1002', title: 'New title 3' }
    ];
    const ids = texts.map(text => text.id);
    const titles = texts.map(text => text.title);
    db.upsert('texts', texts)
    .then(texts => db.upsert('texts', texts))
    .then(res => {
      expect(res instanceof Array).toBe(true);
      expect(ids).toContain(res[0].id);
      expect(titles).toContain(res[0].title);
      done();
    }).catch(err => fail(err));
  });

  it('can upsert an existing document as a new document', function (done) {
    db.upsert('texts', { id: '1003', title: 'Original title' })
    .then(text => db.upsert('texts', text, { createId: true }))
    .then(res => {
      expect(res instanceof Array).toBe(false);
      expect(res.id).not.toEqual('1003');
      expect(res.title).toBe('Original title');
      done();
    }).catch(err => fail(err));
  });

  it('can create a user with an email ID', function (done) {
    const user = { id: `user${Date.now()}@test.com`, firstName: 'Testy', lastName: 'McTester' };
    db.create('users', user).then(res => {
      expect(res instanceof Array).toBe(false);
      expect(res.id).toEqual(user.id);
      done();
    }).catch(err => fail(err));
  });

  it('returns a 409 response if the email of a new user already exists');

  it('can get a user by service ID');

  it('can get a user by email ID');

  it('can get multiple users by email ID');

  it('can log in a user');

  it('can log out a user');

  it('can handled throttled requests (many requests in sequence)');

});
