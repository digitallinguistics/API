/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-invalid-this,
  no-magic-numbers,
  no-underscore-dangle,
  prefer-arrow-callback,
*/

const agent  = require('superagent');
const config = require('../../lib/config');

const {
  db,
  getToken,
  testAsync,
} = require('../utilities');

const {
  coll,
  upsert,
} = db;

const permissions = { owners: [config.testUser] };
const test        = true;
const type        = `Language`;

const defaultData = {
  name: {},
  permissions,
  test,
  type,
};

module.exports = (req, v = ``) => {

  describe(`General`, function() {

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

    it(`anonymizes data`, function() {
      pending(`Need to add Person or Media routes to test this.`);
      // NOTE: write this test in the Person / Media tests when they're created, rather than here
    });

    it(`returns objects without database properties`, testAsync(async function() {

      const res = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(defaultData)
      .expect(201);

      expect(res.body._attachments).toBeUndefined();
      expect(res.body._rid).toBeUndefined();
      expect(res.body._self).toBeUndefined();
      expect(res.body.permissions).toBeUndefined();

    }));

    it(`does not return resources that have a TTL`, testAsync(async function() {

      const doc = await upsert(coll, Object.assign({ ttl: 500 }, defaultData));

      await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(410);

    }));

    it(`dlx-max-item-count`, testAsync(async function() {

      const continuationHeader = `dlx-continuation`;
      const maxItemHeader      = `dlx-max-item-count`;

      await Promise.all(Array(3).fill({}).map(() => upsert(coll, defaultData)));

      const res = await req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(maxItemHeader, 2)
      .expect(200);

      expect(res.body.length).toBe(2);
      expect(res.headers[continuationHeader]).toBeDefined();

      await req.get(`${v}/languages`)
      .set(maxItemHeader, 2)
      .set(`Authorization`, `Bearer ${token}`)
      .set(continuationHeader, res.headers[continuationHeader])
      .expect(200);

    }), 10000);

    it(`If-Modified-Since`, testAsync(async function() {

      const wait = () => new Promise(resolve => setTimeout(resolve, 1000));

      await upsert(coll, defaultData);
      await wait();
      const doc = await upsert(coll, defaultData);

      const res = await req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-Modified-Since`, new Date(doc._ts * 1000).toUTCString())
      .expect(200);

      expect(res.body.length >= 1).toBe(true);

    }));

    it(`304: Not Modified`, testAsync(async function() {

      const doc = await upsert(coll, defaultData);

      await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-None-Match`, doc._etag)
      .expect(304);

    }));

  });

};
