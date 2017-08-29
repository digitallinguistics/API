/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-invalid-this,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const config = require('../../lib/config');
const http   = require('http');

const {
  db,
  getToken,
  jwt,
  testAsync,
} = require('../utilities');

const {
  coll,
  upsert,
} = db;

const test = true;
const ttl  = 500;
const type = `Language`;

const permissions = {
  contributors: [],
  owners:       [config.testUser],
  public:       false,
  viewers:      [],
};

const defaultData = {
  name: {},
  permissions,
  test,
  type,
};

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = ``) => {

  describe(`Errors`, function() {

    let token;

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    it(`401: credentials_required`, testAsync(async function() {

      const res = await req.get(`${v}/test`)
      .expect(401);

      expect(res.headers[`www-authenticate`]).toBeDefined();
      expect(res.body.error).toBe(`credentials_required`);

    }));

    it(`403: Forbidden`, testAsync(async function() {

      const lang = {
        name: {},
        permissions: {
          contributors: [],
          owners:  [],
          public:  false,
          viewers: [],
        },
        test,
        type,
      };

      const doc = await upsert(coll, lang);

      await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(403);

    }));

    it(`403: Forbidden (scope)`, testAsync(async function() {

      const payload = {
        azp:   config.authClientID,
        scope: `public`,
      };

      const opts = {
        audience: [`https://api.digitallinguistics.io/`],
        issuer:   `https://${config.authDomain}/`,
        subject:  config.testUser,
      };

      const token = await jwt.signJwt(payload, config.authSecret, opts);

      await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(defaultData)
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

    it(`404: Not Found (DELETE + If-Match)`, testAsync(async function() {
      await req.delete(`${v}/languages/does-not-exist`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-Match`, `fake-if-match-header`)
      .expect(404);
    }));

    it(`405: Method Not Allowed`, testAsync(async function() {
      await req.patch(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(405);
    }));

    it(`409: Data Conflict`, testAsync(async function() {

      const doc = await upsert(coll, defaultData);

      const res = await req.post(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(doc)
      .expect(409);

      expect(res.body.error_description.includes(`ID`)).toBe(true);

    }));

    it(`412: Precondition Failed`, testAsync(async function() {

      const doc = await upsert(coll, defaultData);

      const res = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-Match`, `bad-etag`)
      .send(doc)
      .expect(412);

      expect(res.body.error_description.includes(`ID`)).toBe(true);

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
        type,
      };

      await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(lang)
      .expect(422);

    }));

    it(`429: rate limit`, function(done) {

      pending(`Only run this test as needed.`);

      const opts = {
        headers: { Authorization: `Bearer ${token}` },
        path: `${v}/test`,
        port: config.port,
      };

      const test = () => new Promise((resolve, reject) => {
        const req = http.get(opts, res => {
          if (res.statusCode === 200) resolve();
          else if (res.statusCode === 429) done();
        });
        req.on(`error`, reject);
      });

      const arr   = Array(750).fill({});
      const tasks = arr.map(test);

      Promise.all(tasks)
      .then(fail)
      .catch(fail);

    }, 10000);

  });

};
