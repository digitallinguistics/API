/* eslint-disable
  consistent-return,
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-invalid-this,
  no-magic-numbers,
  no-shadow,
  no-underscore-dangle,
  object-curly-newline,
  object-property-newline,
  prefer-arrow-callback
*/

const config      = require(`../lib/config`);
const handleError = require(`./handleError`);
const jwt         = require(`jsonwebtoken`);
const { client: db, coll } = require(`../lib/db`);

const ttl = 500; // 3 minutes

module.exports = (req, v = ``) => {

  describe(`Routes`, function() {

    const test = true;
    const tid  = `testlanguage`;

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

    it(`returns simplified data objects`, function(done) {

      const lang = { emptyProp: '', ttl };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.emptyProp).toBeUndefined())
      .then(done)
      .catch(handleError(done));
    });

    it(`returns objects without database properties`, function(done) {

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
      .catch(handleError(done));

    });

    it(`does not return resources that have a TTL`, function(done) {

      const lang = {
        permissions: { public: true },
        ttl,
      };

      db.upsertDocument(coll, lang, (err, doc) => {

        if (err) return fail(err);

        req.get(`${v}/languages/${doc.id}`)
        .set(`Authorization`, `Bearer ${this.token}`)
        .expect(404)
        .then(done)
        .catch(handleError(done));

      });

    });

    it(`PUT /languages (one language)`, function(done) {

      const lang = { tid, ttl };

      req.put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(tid))
      .then(done)
      .catch(handleError(done));

    });

    it(`PUT /languages (multiple languages)`, function(done) {
      req.put(`${v}/languages`)
      .send([
        { tid: `lang1`, ttl },
        { tid: `lang2`, ttl },
      ])
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => {
        expect(res.body.length).toBe(2);
        expect(res.body.some(lang => lang.tid === `lang1`)).toBe(true);
        expect(res.body.some(lang => lang.tid === `lang2`)).toBe(true);
      })
      .then(done)
      .catch(handleError(done));
    });

    it(`PUT /languages/{language}`, function(done) {

      const lang = { tid: `lang3`, ttl };

      req.put(`${v}/languages/lang1`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(lang.tid))
      .then(done)
      .catch(handleError(done));

    });

    xit(`GET /languages`, function(done) {
      req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => expect(Array.isArray(res)).toBe(true))
      .then(done)
      .catch(handleError(done));
    });

    xit(`GET /languages?ids={ids}`, function(done) {
      req.get(`${v}/languages?ids=${tid}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(Array.body.length).toBe(1);
        expect(res.body[0].id).toBe(tid);
      })
      .then(done)
      .catch(handleError(done));
    });

    it(`GET /languages/{language}`, function(done) {

      const lang = {
        id: tid,
        permissions: { public: true },
        test,
        tid,
        ttl,
      };

      db.upsertDocument(coll, lang, err => {

        if (err) return fail(err);

        req.get(`${v}/languages/${tid}`)
        .set(`Authorization`, `Bearer ${this.token}`)
        .expect(200)
        .expect(res => expect(res.body.id).toBe(tid))
        .then(done)
        .catch(handleError(done));

      });

    });

    xit(`DELETE /languages/{language}`, function(done) {
      req.delete(`${v}/languages/${tid}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(204)
      .then(done)
      .catch(handleError(done));
    });

    xit(`DELETE /languages`, function(done) {
      req.delete(`${v}/languages?ids=lang1,lang2`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(204)
      .then(done)
      .catch(handleError(done));
    });

  });

};
