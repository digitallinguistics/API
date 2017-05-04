/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const config   = require(`../lib/config`);
const getToken = require(`./token`);
const http     = require(`http`);
const jwt      = require(`jsonwebtoken`);
const { client: db, coll } = require(`../lib/db`);

const test = true;

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = ``) => {

  describe(`API Errors`, function() {

    beforeAll(function(done) {
      getToken()
      .then(token => { this.token = token; })
      .then(done)
      .catch(fail);
    });

    it(`HTTP > HTTPS`, function(done) {

      const req = http.get(`http://api.digitallinguistics.io/test`, res => {
        let data = ``;
        res.on(`error`, fail);
        res.on(`data`, chunk => { data += chunk; });
        res.on(`end`, () => {
          expect(res.headers.location.includes(`https`)).toBe(true);
          done();
        });
      });

      req.on(`error`, fail);

    });

    it(`401: credentials_required`, function(done) {
      req.get(`${v}/test`)
      .expect(401)
      .expect(res => {
        expect(res.headers[`www-authenticate`]).toBeDefined();
        expect(res.body.error).toBe(`credentials_required`);
      })
      .then(done)
      .catch(fail);
    });

    it(`403: bad user permissions`, function(done) {

      const lang = { test };

      db.upsertDocument(coll, lang, (err, doc) => {

        if (err) fail(err);

        req.get(`${v}/languages/${doc.id}`)
        .set(`Authorization`, `Bearer ${this.token}`)
        .expect(403)
        .then(done)
        .catch(fail);

      });

    });

    it(`403: bad scope`, function(done) {

      const payload = {
        azp:   config.authClientId,
        scope: `public`,
      };

      const opts = {
        audience: [`https://api.digitallinguistics.io/`],
        issuer:   `https://${config.authDomain}/`,
        subject:  config.testUser,
      };

      jwt.sign(payload, config.authSecret, opts, (err, token) => {

        if (err) fail(err);

        const lang = {
          id: `test-403`,
          test,
        };

        const put = () => req.put(`${v}/languages`)
        .set(`Authorization`, `Bearer ${token}`)
        .send(lang)
        .expect(403);

        const destroy = () => req.delete(`${v}/languages/${lang.id}`)
        .set(`Authorization`, `Bearer ${token}`)
        .expect(403);

        put()
        .then(destroy)
        .then(done)
        .catch(fail);

      });

    });

    it(`404: No Route`, function(done) {
      req.get(`${v}/badroute`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(404)
      .then(done)
      .catch(fail);
    });

    it(`404: resource does not exist`, function(done) {

      req.get(`${v}/languages/does-not-exist`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(404)
      .then(done)
      .catch(fail);

    });

    it(`405: Method Not Allowed`, function(done) {
      req.post(`${v}/test`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(405)
      .then(done)
      .catch(fail);
    });

    it(`412: Precondition Failed`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        ttl: 500,
      };

      db.upsertDocument(coll, lang, (err, doc) => {

        if (err) return fail(err);

        const test1 = () => req.put(`${v}/languages`)
        .set(`Authorization`, `Bearer ${this.token}`)
        .set(`If-Match`, `bad-etag`)
        .send(doc)
        .expect(412);

        const test2 = () => req.delete(`${v}/languages/${doc.id}`)
        .set(`Authorization`, `Bearer ${this.token}`)
        .set(`If-Match`, `bad-etag`)
        .expect(412);

        test1()
        .then(test2)
        .then(done)
        .catch(fail);

      });

    });

    it(`422: malformed data`, function(done) {

      const lang = {
        name: true,
        test,
      };

      req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .send(lang)
      .expect(422)
      .then(done)
      .catch(fail);

    });

    xit(`429: rate limit`, function(done) {

      const arr = Array(600).fill({});

      const test = () => req.get(`${v}/test`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200);

      Promise.all(arr.map(test))
      .then(fail)
      .catch(err => {
        console.error(err);
        done();
      });

    });

    it(`GET /test`, function(done) {
      req.get(`${v}/test`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .expect(res => expect(res.body.message).toBe(`Test successful.`))
      .then(done)
      .catch(fail);
    });

  });

};
