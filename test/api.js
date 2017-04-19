/* eslint-disable
  consistent-return,
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-invalid-this,
  no-magic-numbers,
  no-param-reassign,
  no-shadow,
  no-underscore-dangle,
  object-curly-newline,
  object-property-newline,
  prefer-arrow-callback
*/

const config = require(`../lib/config`);
const jwt    = require(`jsonwebtoken`);
const { client: db, coll } = require(`../lib/modules/db`);

const ttl  = 500; // 3 minutes
const type = `Language`;

const deleteDocument = link => new Promise((resolve, reject) => {
  db.deleteDocument(link, (err, res) => {
    if (err) reject(err);
    else resolve(res);
  });
});


const upsertDocument = data => new Promise((resolve, reject) => {
  db.upsertDocument(coll, data, (err, res) => {
    if (err) reject(err);
    resolve(res);
  });
});

module.exports = (req, v = ``) => {

  describe(`REST API`, function() {

    beforeAll(function(done) {

      const payload = {
        azp:   config.authClientId,
        scope: `user`,
      };

      const opts = {
        audience: [`https://api.digitallinguistics.io/`],
        issuer:   `https://${config.authDomain}/`,
        subject:  config.testUser,
      };

      jwt.sign(payload, config.authSecret, opts, (err, token) => {
        if (err) return fail(err);
        this.token = token;
        done();
      });

    });

    // NB: This may have to be run multiple times to clear the database
    // using .reduce() causes problems where only one document is deleted
    afterAll(function(done) {

      const query = `
        SELECT * FROM items d
        WHERE CONTAINS(d.id, "test") OR d.test = true
      `;

      db.queryDocuments(coll, query).toArray((err, res) => {
        if (err) return fail(err);
        const links = res.map(doc => doc._self);
        Promise.all(links.map(deleteDocument)).then(done).catch(fail);
      });

    }, 20000);

    xit(`returns simplified data objects`, function(done) {

      const lang = { emptyProp: '', ttl };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.emptyProp).toBeUndefined())
      .then(done)
      .catch(fail);

    });

    xit(`returns objects without database properties`, function(done) {

      const lang = { ttl };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => {
        expect(res.body._rid).toBeUndefined();
        expect(res.body._self).toBeUndefined();
        expect(res.body._attachments).toBeUndefined();
        expect(res.body.permissions).toBeUndefined();
      })
      .then(done)
      .catch(fail);

    });

    xit(`does not return resources that have a TTL`, function(done) {

      const lang = {
        permissions: { public: true },
        ttl,
      };

      const test = doc => req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(404);

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    it(`supports pagination`, function(done) {

      const continuationHeader = `x-dlx-continuation`;
      const maxItemHeader      = `x-dlx-max-item-count`;

      const test1 = () => req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .set(maxItemHeader, 10)
      .expect(200)
      .expect(res => expect(res.body.length).toBe(10))
      .expect(res => expect(res.headers[continuationHeader]).toBeDefined())
      .then(res => res.headers[continuationHeader]);

      const test2 = continuation => req.get(`${v}/languages`)
      .set(maxItemHeader, 10)
      .set(`Authorization`, `Bearer ${this.token}`)
      .set(continuationHeader, continuation)
      .expect(200);

      Array(15)
      .fill({})
      .reduce(p => p.then(() => upsertDocument({
        permissions: { public: true },
        test: true,
        type,
      })), Promise.resolve())
      .then(test1)
      .then(test2)
      .then(done)
      .catch(fail);

    }, 10000);

    xit(`returns 207 for partial finds`, function(done) {

      const lang = {
        id: `test-207`,
        permissions: { public: true },
        type,
      };

      const test = () => req.get(`${v}/languages?ids=${lang.id},207test`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(207)
      .expect(res => expect(res.body.length).toBe(1));

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    xit(`PUT /languages (one language)`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        tid: `putOne`,
        ttl,
      };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(lang.tid))
      .then(done)
      .catch(fail);

    });

    xit(`PUT /languages (multiple languages)`, function(done) {
      req.put(`${v}/languages`)
      .send([
        { tid: `putMany1`, ttl },
        { tid: `putMany2`, ttl },
      ])
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => {
        expect(res.body.length).toBe(2);
        expect(res.body.some(lang => lang.tid === `putMany1`)).toBe(true);
        expect(res.body.some(lang => lang.tid === `putMany2`)).toBe(true);
      })
      .then(done)
      .catch(fail);
    });

    xit(`PUT /languages/{language}`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        tid: `upsertOne`,
        ttl,
      };

      const test = doc => req.put(`${v}/languages/${doc.id}`)
      .send(doc)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(doc.tid));

      upsertDocument(lang)
      .then(doc => {
        doc.tid = `upsertOneAgain`;
        return doc;
      })
      .then(test)
      .then(done)
      .catch(fail);

    });

    // NB: this test assumes that there are currently multiple languages in the database
    it(`GET /languages`, function(done) {
      req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => expect(res.body.length).toBeDefined())
      .then(done)
      .catch(fail);
    });

    xit(`GET /languages/{language}`, function(done) {

      const lang = {
        id: `test-getLanguage`,
        permissions: { public: true },
        type,
      };

      const test = () => req.get(`${v}/languages/${lang.id}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200);

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    xit(`GET /languages?ids={ids}`, function(done) {

      const id1 = `test-getByIds1`;
      const id2 = `test-getByIds2`;

      const lang = {
        id: id1,
        permissions: { public: true },
        test: true,
        type,
      };

      const test = () => req.get(`${v}/languages?ids=${id1},${id2}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => expect(res.body.length).toBe(2));

      upsertDocument(lang)
      .then(() => { lang.id = id2; })
      .then(() => upsertDocument(lang))
      .then(test)
      .then(done)
      .catch(fail);

    });

    xit(`DELETE /languages/{language}`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        ttl,
      };

      const test = doc => req.delete(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(204);

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    xit(`DELETE /languages`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        ttl,
      };

      db.upsertDocument(coll, lang, (err, doc) => {

        if (err) return fail(err);

        const id1 = doc.id;

        db.upsertDocument(coll, lang, (err, doc) => {

          if (err) return fail(err);

          const id2 = doc.id;

          req.delete(`${v}/languages?ids=${id1},${id2}`)
          .set(`Authorization`, `Bearer ${this.token}`)
          .expect(204)
          .then(done)
          .catch(fail);

        });

      });

    });

  });

};
