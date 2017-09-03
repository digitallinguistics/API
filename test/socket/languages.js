/* eslint-disable
  func-names,
  max-nested-callbacks,
  prefer-arrow-callback,
  sort-keys,
*/

const config = require('../../lib/config');

const {
  authenticate,
  db,
  getToken,
  testAsync,
} = require('../utilities');

const {
  coll,
  upsert,
} = db;

const test = true;
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

module.exports = (v = ``) => {

  describe(`Languages`, function() {

    let token;
    let client;
    let emit;

    beforeAll(testAsync(async function() {

      token  = await getToken();
      client = await authenticate(v, token);

      emit = (...args) => new Promise((resolve, reject) => {
        client.emit(...args, (err, res, info) => {
          if (err) return reject(err);
          resolve({ res, info });
        });
      });

    }));

    it(`add`, testAsync(async function() {
      const data = Object.assign({ tid: `add` }, defaultData);
      const { res }  = await emit(`addLanguage`, data);
      expect(res.tid).toBe(data.tid);
    }));

    it(`delete`, testAsync(async function() {
      const doc = await upsert(coll, Object.assign({}, defaultData));
      const { res } = await emit(`deleteLanguage`, doc.id);
      expect(res.status).toBe(204);
    }));

    it(`get`, testAsync(async function() {

      const doc  = await upsert(coll, Object.assign({ tid: `get` }, defaultData));
      const { res: lang } = await emit(`getLanguage`, doc.id);

      expect(lang.tid).toBe(`get`);

    }));

    it(`getAll`, testAsync(async function() {

      const data = {
        name: {},
        permissions: { owner: [`some-other-user`] },
        test,
        tid: `getAll`,
        type,
      };

      const doc = await upsert(coll, data);
      await upsert(coll, Object.assign({}, defaultData));
      const { res, info } = await emit(`getLanguages`);

      expect(res.length).toBeGreaterThan(0);
      expect(info.itemCount).toBeGreaterThan(0);
      expect(res.some(item => item.tid === doc.tid)).toBe(false);

    }));

    it(`update`, testAsync(async function() {

      const data = Object.assign({
        notChanged: `This property should not be changed.`,
        tid:        `upsertOne`,
      }, defaultData);

      const doc = await upsert(coll, data);

      const newData = {
        id: doc.id,
        test,
        tid: `upsertOneAgain`,
        type,
      };

      const { res } = await emit(`updateLanguage`, newData);

      expect(res.notChanged).toBe(doc.notChanged);
      expect(res.tid).toBe(newData.tid);

    }));

    it(`upsert`, testAsync(async function() {
      const data = Object.assign({ tid: `upsert` }, defaultData);
      const { res } = await emit(`upsertLanguage`, data);
      expect(res.tid).toBe(data.tid);
    }));

  });

};
