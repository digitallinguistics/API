/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-invalid-this,
  no-magic-numbers,
  prefer-arrow-callback,
*/

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

const permissions = {
  contributors: [],
  owners:  [config.testUser],
  public:  false,
  viewers: [],
};
const test        = true;
const type        = `Language`;

const defaultData = {
  name: {},
  permissions,
  test,
  type,
};

module.exports = (req, v = ``) => {

  describe(`Languages`, function() {

    let token;

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    it(`type: Language`, testAsync(async function() {

      const res = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(defaultData);

      expect(res.body.type).toBe(`Language`);

    }));

    it(`GET /languages?public=true`, testAsync(async function() {

      const data = {
        name: {},
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

    it(`POST /languages`, testAsync(async function() {

      const res = await req.post(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(Object.assign({ tid: `post` }, defaultData))
      .expect(201);

      expect(res.body.tid).toBe(`post`);

    }));

    it(`PUT /languages`, testAsync(async function() {

      const data = Object.assign({ tid: `put` }, defaultData);

      // test create
      const res1 = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(data)
      .expect(201);

      // test upsert
      const res2 = await req.put(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(Object.assign(res1.body, { newProp: true }))
      .expect(201);

      expect(typeof res2.headers[`last-modified`]).toBe(`string`);
      expect(res2.headers[`last-modified`]).not.toBe(`Invalid Date`);
      expect(res2.body.tid).toBe(data.tid);
      expect(res2.body.newProp).toBe(true);

    }));

    it(`PATCH /languages/{language}`, testAsync(async function() {

      const data = Object.assign({
        notChanged: `This property should not be changed.`,
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
        name: { eng: `First Language` },
        permissions: { owners: [`some-other-user`] },
        test,
        tid: `GET /languages`,
        type,
      };

      const secondItem = {
        name: { eng: `Second Language` },
        permissions: { owners: [config.testUser] },
        test,
        type,
      };

      await upsert(coll, firstItem);
      await upsert(coll, secondItem);

      const res = await req.get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(`dlx-item-count`, /[0-9]+/)
      .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some(item => item.tid === firstItem.tid)).toBe(false);

    }), 10000);

    it(`GET /languages/{language}`, testAsync(async function() {

      const doc = await upsert(coll, Object.assign({ tid: `getLanguage` }, defaultData));

      const res = await req.get(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      expect(res.headers[`last-modified`]).toBeDefined();
      expect(res.body.tid).toBe(doc.tid);

    }));

    it(`DELETE /languages/{language}`, testAsync(async function() {

      const doc = await upsert(coll, Object.assign({}, defaultData));

      await req.delete(`${v}/languages/${doc.id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(204);

    }));

  });

};
