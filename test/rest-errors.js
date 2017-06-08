/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const agent       = require('superagent');
const config      = require('../lib/config');
const getToken    = require('./token');
const { signJwt } = require('./jwt');
const testAsync   = require('./async');

const {
  coll,
  upsert,
} = require(`./db`);

const permissions = {
  contributor: [],
  owner:       [],
  public:      false,
  viewer:      [],
};

const test = true;
const ttl  = 500;

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = ``) => {

  describe(`REST API Errors`, function() {

    let token;

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    it(`HTTP > HTTPS`, testAsync(async function() {
      try {
        await agent.get(`http://api.digitallinguistics.io/test`)
        .set(`Authorization`, `Bearer ${token}`);
      } catch (err) {
        expect(err.response.redirects[0].includes(`https`));
      }
    }));

    it(`401: credentials_required`, testAsync(async function() {

      const res = await req.get(`${v}/test`)
      .expect(401);

      expect(res.headers[`www-authenticate`]).toBeDefined();
      expect(res.body.error).toBe(`credentials_required`);

    }));

    it(`403: Forbidden`, testAsync(async function() {

      const lang = {
        permissions,
        test,
        type: `Language`,
      };

      const doc = await upsert(coll, lang);

      await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(403);

    }));

    it(`403: Forbidden (scope)`, testAsync(async function() {

      const payload = {
        azp:   config.authClientId,
        scope: `public`,
      };

      const opts = {
        audience: [`https://api.digitallinguistics.io/`],
        issuer:   `https://${config.authDomain}/`,
        subject:  config.testUser,
      };

      const token = await signJwt(payload, config.authSecret, opts);

      const data = {
        test,
        ttl,
        type: `Language`,
      };

      await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(data)
      .expect(403);

    }));

    it(`404: No Route`, testAsync(async function() {
      await req.get(`${v}/badroute`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(404);
    }));

    it(`404: Not Found`, testAsync(async function() {
      await req.get(`${v}/languages/does-not-exist`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(404)
      .expect(res => expect(res.body.error_description.includes(`ID`)).toBe(true));
    }));

    it(`405: Method Not Allowed`, testAsync(async function() {
      await req.post(`${v}/test`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(405);
    }));

    it(`409: Data Conflict`, testAsync(async function() {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        ttl,
        type: `Language`,
      };

      await upsert(coll, data);

      const res = await req.post(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(data)
      .expect(409);

      expect(res.body.error_description.includes(`ID`)).toBe(true);

    }));

    it(`412: Precondition Failed`, testAsync(async function() {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        ttl,
        type: `Language`,
      };

      const doc = await upsert(coll, data);

      await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-Match`, `bad-etag`)
      .send(doc)
      .expect(412);

      await req.delete(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-Match`, `bad-etag`)
      .expect(412);

    }));

    it(`422: Malformed Data`, testAsync(async function() {

      const lang = {
        name: true,
        test,
        ttl,
      };

      await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(lang)
      .expect(422);

    }));

    it(`429: rate limit`, function(done) {

      pending(`Only run this as needed.`);

      const arr = Array(600).fill({});

      const test = () => req.get(`${v}/test`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      Promise.all(arr.map(test))
      .then(fail)
      .catch(done);

    });

    it(`GET /test`, testAsync(async function() {

      const res = await req.get(`${v}/test`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      expect(res.body.message).toBe(`Test successful.`);

    }));

  });

};
