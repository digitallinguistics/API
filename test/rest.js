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

const config    = require('../lib/config');
const getToken  = require('./token');
const testAsync = require('./async');

const {
  coll,
  upsert,
} = require('./db');

const name = `Language Name`;
const test = true;
const ttl  = 500;
const type = `Language`;

module.exports = (req, v = ``) => {

  describe(`REST API`, function() {

    let token;

    const defaultData = {
      name,
      permissions: { owners: [config.testUser] },
      test,
      ttl,
      type,
    };

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    beforeEach(function() {
      Reflect.deleteProperty(defaultData, `id`);
    });

    it(`anonymizes data`, function() {
      pending(`Need to add Person or Media routes to test this.`);
    });

    it(`adds a "type" field`, testAsync(async function() {

      const res = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send({});

      expect(res.body.type).toBe(`Language`);

    }));

    it(`returns simplified data objects`, testAsync(async function() {

      const data = Object.assign({ emptyProp: '' }, defaultData);

      const res = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(data)
      .expect(201);

      expect(typeof res.headers[`last-modified`]).toBe(`string`);
      expect(res.headers[`last-modified`]).not.toBe(`Invalid Date`);
      expect(res.body.emptyProp).toBeUndefined();

    }));

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

      const doc = await upsert(coll, defaultData);

      await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(404);

    }));

    it(`dlx-max-item-count`, testAsync(async function() {

      const data = {
        name,
        permissions: { owners: [config.testUser] },
        test,
        type,
      };

      const continuationHeader = `dlx-continuation`;
      const maxItemHeader      = `dlx-max-item-count`;

      await Promise.all(Array(3).fill({}).map(() => upsert(coll, Object.assign({}, data))));

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

    it(`public={Boolean}`, testAsync(async function() {

      const data = {
        name,
        permissions: { public: true },
        test,
        type,
      };

      const doc = await upsert(coll, data);

      const res = await req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .query({ public: true })
      .expect(200);

      expect(res.body.some(item => item.id === doc.id)).toBe(true);

    }), 10000);

    it(`304: Not Modified`, testAsync(async function() {

      const data = {
        name,
        permissions: { owners: [config.testUser] },
        test,
        type,
      };

      const doc = await upsert(coll, data);

      await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-None-Match`, doc._etag)
      .expect(304);

    }));

    it(`POST /languages`, testAsync(async function() {

      const res = await req.post(`${v}/languages`)
      .send(Object.assign({ tid: `post` }, defaultData))
      .set(`Authorization`, `Bearer ${token}`)
      .expect(201);

      expect(res.body.tid).toBe(`post`);

    }));

    it(`PUT /languages`, testAsync(async function() {

      const data = Object.assign({ tid: `put` }, defaultData);
      const doc  = await upsert(coll, data);

      const res = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(doc)
      .expect(201);

      expect(typeof res.headers[`last-modified`]).toBe(`string`);
      expect(res.headers[`last-modified`]).not.toBe(`Invalid Date`);
      expect(res.body.tid).toBe(data.tid);

    }));

    it(`PATCH /languages/{language}`, testAsync(async function() {

      const data = Object.assign({
        notChnaged: `This property should not be changed.`,
        tid:        `upsertOne`,
      }, defaultData);

      const doc = await upsert(coll, data);

      const res = await req.patch(`${v}/languages/${doc.id}`)
      .send({ tid: `upsertOneAgain` })
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      expect(typeof res.headers[`last-modified`]).toBe(`string`);
      expect(res.headers[`last-modified`]).not.toBe(`Invalid Date`);
      expect(res.body.notChanged).toBe(data.notChanged);
      expect(res.body.tid).toBe(`upsertOneAgain`);

    }));

    it(`GET /languages`, testAsync(async function() {

      const firstItem = {
        name: `First Language`,
        permissions: { owners: [`some-other-user`] },
        test,
        tid: `GET /languages`,
        type,
      };

      const secondItem = {
        name: `Second Language`,
        permissions: { owners: [config.testUser] },
        test,
        type,
      };

      await upsert(coll, firstItem);
      await upsert(coll, secondItem);

      const res = await req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some(item => item.tid === firstItem.tid)).toBe(false);

    }), 10000);

    it(`GET /languages (If-Modified-Since)`, testAsync(async function() {

      const wait = () => new Promise(resolve => setTimeout(resolve, 1000));

      const data = {
        name,
        permissions: { owners: [config.testUser] },
        test,
        type,
      };

      await upsert(coll, data);
      await wait();
      const doc = await upsert(coll, data);

      const res = await req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .set(`If-Modified-Since`, new Date(doc._ts * 1000).toUTCString())
      .expect(200);

      expect(res.body.length >= 1).toBe(true);

    }));

    it(`GET /languages/{language}`, testAsync(async function() {

      const data = {
        name,
        permissions: {
          contributors: [],
          owners:       [config.testUser],
          public:       false,
          viewers:      [],
        },
        test,
        type,
      };

      const doc = await upsert(coll, data);

      const res = await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      expect(res.headers[`last-modified`]).toBeDefined();

    }));

    it(`DELETE /languages/{language}`, testAsync(async function() {

      const doc = await upsert(coll, defaultData);

      await req.delete(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(204);

    }));

  });

};
