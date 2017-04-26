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

const config   = require(`../lib/config`);
const getToken = require(`./token`);
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
  const hasId = data.id;
  db.upsertDocument(coll, data, (err, res) => {
    if (!hasId) Reflect.deleteProperty(data, `id`);
    if (err) reject(err);
    resolve(res);
  });
});

module.exports = (req, v = ``) => {

  describe(`REST API`, function() {

    beforeAll(function(done) {
      getToken().then(token => { this.token = token; }).then(done).catch(fail);
    });

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

    it(`anonymizes data`, function(done) {
      pending(`Need to add Person or Media routes to test this.`);
      done();
    });

    it(`returns simplified data objects`, function(done) {

      const lang = { emptyProp: '', ttl, type };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.emptyProp).toBeUndefined())
      .then(done)
      .catch(fail);

    });

    it(`returns objects without database properties`, function(done) {

      const lang = { ttl, type };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => {
        expect(res.body._attachments).toBeUndefined();
        expect(res.body._rid).toBeUndefined();
        expect(res.body._self).toBeUndefined();
        expect(res.body._ts).toBeUndefined();
        expect(res.body.permissions).toBeUndefined();
      })
      .then(done)
      .catch(fail);

    });

    it(`does not return resources that have a TTL`, function(done) {

      const lang = {
        permissions: { public: true },
        ttl,
        type,
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

      const continuationHeader = `dlx-continuation`;
      const maxItemHeader      = `dlx-max-item-count`;

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

    it(`304: Not Modified`, function(done) {

      const lang = {
        permissions: { public: true },
        test: true,
        type,
        // don't set a ttl here
      };

      const test = doc => req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .set(`If-None-Match`, doc._etag)
      .expect(304);

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    it(`POST /languages`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        tid: `post`,
        ttl,
        type,
      };

      req.post(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(lang.tid))
      .then(done)
      .catch(fail);

    });

    it(`PUT /languages`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        tid: `put`,
        ttl,
        type,
      };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(lang.tid))
      .then(done)
      .catch(fail);

    });

    it(`PATCH /languages/{language}`, function(done) {

      const lang = {
        notChanged: `This property should not be changed.`,
        permissions: { owner: [config.testUser] },
        tid: `upsertOne`,
        ttl,
        type,
      };

      const test = doc => req.patch(`${v}/languages/${doc.id}`)
      .send({ tid: `upsertOneAgain` })
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.notChanged).toBe(lang.notChanged);
        expect(res.body.tid).toBe(`upsertOneAgain`);
      });

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    it(`GET /languages`, function(done) {

      const lang1 = {
        permissions: { owner: [`some-other-user`] },
        test: true,
        tid: `GET languages test`,
        type,
      };

      const lang2 = {
        permissions: { public: true },
        test: true,
        type,
      };

      const filter = results => results.filter(item => item.tid === `some-other-user`);

      const test = () => req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => expect(res.body.length).toBeGreaterThan(0))
      .expect(res => expect(filter(res.body).length).toBe(0));

      upsertDocument(lang1)
      .then(() => upsertDocument(lang2))
      .then(test)
      .then(done)
      .catch(fail);

    }, 10000);

    it(`GET /languages - If-Modified-Since`, function(done) {

      const lang = {
        permissions: { public: true },
        test: true,
        type,
      };

      const request = ts => req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .set(`If-Modified-Since`, ts)
      .expect(200)
      .expect(res => expect(res.body.length).toBe(1));

      const wait = () => new Promise(resolve => setTimeout(resolve, 1000));

      const test = async () => {
        await upsertDocument(lang);
        await wait();
        const doc2 = await upsertDocument(lang);
        await request(new Date(doc2._ts * 1000).toUTCString());
      };

      test().then(done).catch(fail);

    });

    it(`GET /languages/{language}`, function(done) {

      const lang = {
        id: `test-getLanguage`,
        permissions: { public: true },
        type,
      };

      const test = () => req.get(`${v}/languages/${lang.id}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => expect(res.headers[`last-modified`]).toBeDefined());

      upsertDocument(lang)
      .then(test)
      .then(done)
      .catch(fail);

    });

    it(`DELETE /languages/{language}`, function(done) {

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

  });

};
