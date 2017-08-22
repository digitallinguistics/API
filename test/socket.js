/* eslint-disable
  camelcase,
  func-names,
  handle-callback-err,
  max-nested-callbacks,
  max-statements,
  max-statements-per-line,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback,
*/

const authenticate  = require('./authenticate');
const config        = require('../lib/config');
const getToken      = require('./token');
const { promisify } = require('util');
const testAsync     = require('./async');

const {
  coll,
  upsert,
} = require('./db');

module.exports = (req, v = ``) => {

  describe(`Socket API`, function() {

    let client;
    let emit;
    let token;

    const name = { eng: `Language Name` };
    const test = true;
    const ttl  = 500;
    const type = `Language`;

    const defaultData = {
      name,
      permissions: {
        contributors: [],
        owners:       [config.testUser],
        public:       false,
        viewers:      [],
      },
      test,
      ttl,
      type,
    };

    beforeAll(testAsync(async function() {
      token  = await getToken();
      client = await authenticate(v, token);
      emit   = promisify(client.emit).bind(client);
    }));

    beforeEach(function() {
      Reflect.deleteProperty(defaultData, `id`);
    });


    // FEATURES
    it(`can authenticate twice`, function(done) {
      client.on(`authenticated`, done);
      client.on(`error`, fail);
      client.on(`unauthorized`, fail);
      client.emit(`authenticate`, { token }, done);
    });

    it(`option: maxItemCount`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      Reflect.deleteProperty(data, `ttl`);

      await Promise.all(Array(3).fill({}).map(() => upsert(coll, Object.assign({}, data))));

      const continuation = await new Promise((resolve, reject) => {
        client.emit(`getAll`, `Language`, { maxItemCount: 2 }, (err, res, info) => {
          if (err) return reject(err);
          expect(res.length).toBe(2);
          expect(info.continuation).toBeDefined();
          resolve(info.continuation);
        });
      });

      await new Promise((resolve, reject) => {
        client.emit(`getAll`, `Language`, { continuation }, (err, res) => {
          expect(res.length).toBeGreaterThan(0);
          if (err) reject(err);
          else resolve();
        });
      });

    }), 10000);

    it(`304: Not Modified`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      Reflect.deleteProperty(data, `ttl`);

      const doc = await upsert(coll, data);

      try {
        await emit(`get`, doc.id, { ifNoneMatch: doc._etag });
      } catch (e) {
        expect(e.status).toBe(304);
      }

    }));


    // GENERIC CRUD METHODS

    it(`add`, testAsync(async function() {
      const data = Object.assign({ tid: `add` }, defaultData);
      const res  = await emit(`add`, `Language`, data);
      expect(res.tid).toBe(data.tid);
    }));

    it(`delete`, testAsync(async function() {
      const doc = await upsert(coll, defaultData);
      const res = await emit(`delete`, doc.id);
      expect(res.status).toBe(204);
    }));

    it(`get`, testAsync(async function() {

      const data = {
        name,
        permissions: defaultData.permissions,
        test,
        tid: `get`,
        type,
      };

      const doc  = await upsert(coll, data);
      const lang = await emit(`get`, doc.id);

      expect(lang.tid).toBe(data.tid);

    }));

    it(`getAll`, testAsync(async function() {

      const data = {
        name,
        permissions: Object.assign({}, defaultData.permissions),
        test,
        tid: `getAll`,
        type,
      };

      data.permissions.owners = [`some-other-user`];

      const doc = await upsert(coll, data);
      await upsert(coll, defaultData);
      const res = await emit(`getAll`, `Language`);

      expect(res.length).toBeGreaterThan(0);
      expect(res.some(item => item.tid === doc.tid)).toBe(false);

    }));

    it(`update`, testAsync(async function() {

      const data = Object.assign({
        notChanged: `This property should not be changed.`,
        tid:        `upsertOne`,
        type:       `Language`,
      }, defaultData);

      const doc = await upsert(coll, data);

      const newData = {
        id: doc.id,
        test,
        tid: `upsertOneAgain`,
        ttl,
        type,
      };

      const res = await emit(`update`, newData);

      expect(res.notChanged).toBe(doc.notChanged);
      expect(res.tid).toBe(newData.tid);

    }));

    it(`upsert`, testAsync(async function() {
      const data = Object.assign({ tid: `upsert`, type }, defaultData);
      const res = await emit(`upsert`, data);
      expect(res.tid).toBe(data.tid);
    }));

    it(`receives deleted data (REST)`, testAsync(async function() {

      const client = await authenticate(v, token);
      const doc    = await upsert(coll, defaultData);

      await Promise.all([

        req.delete(`${v}/languages/${doc.id}`)
        .set(`Authorization`, `Bearer ${token}`)
        .expect(204),

        new Promise(resolve => client.on(`delete`, id => {
          expect(id).toBe(doc.id);
          client.close();
          resolve();
        })),

      ]);

    }));

    it(`receives deleted data (Socket)`, testAsync(async function() {

      const doc          = await upsert(coll, defaultData);
      const secondClient = await authenticate(v, token);

      await Promise.all([

        new Promise(resolve => secondClient.on(`delete`, id => {
          expect(id).toBe(doc.id);
          secondClient.close();
          resolve();
        })),

        emit(`deleteLanguage`, doc.id),

      ]);

    }));

    it(`receives updated data (REST)`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      Reflect.deleteProperty(data, `ttl`);

      const doc    = await upsert(coll, data);
      const client = await authenticate(v, token);

      await Promise.all([

        new Promise(resolve => client.on(`update`, id => {
          expect(id).toBe(doc.id);
          client.close();
          resolve();
        })),

        req.patch(`${v}/languages/${data.id}`)
        .send(data)
        .set(`Authorization`, `Bearer ${token}`)
        .expect(200),

      ]);

    }));

    it(`receives updated data (Socket)`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      Reflect.deleteProperty(data, `ttl`);

      const doc          = await upsert(coll, data);
      const secondClient = await authenticate(v, token);

      await Promise.all([

        new Promise(resolve => secondClient.on(`update`, id => {
          expect(id).toBe(doc.id);
          secondClient.close();
          resolve();
        })),

        emit(`updateLanguage`, data),

      ]);

    }));

    it(`receives upserted data (REST)`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      Reflect.deleteProperty(data, `ttl`);

      const doc    = await upsert(coll, data);
      const client = await authenticate(v, token);

      await Promise.all([

        new Promise(resolve => client.on(`upsert`, id => {
          expect(id).toBe(doc.id);
          client.close();
          resolve();
        })),

        req.put(`${v}/languages`)
        .send(data)
        .set(`Authorization`, `Bearer ${token}`)
        .expect(201),

      ]);

    }));

    it(`receives upserted data (Socket)`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      Reflect.deleteProperty(data, `ttl`);

      const secondClient = await authenticate(v, token);

      await Promise.all([

        new Promise(resolve => secondClient.on(`upsert`, () => {
          secondClient.close();
          resolve();
        })),

        emit(`upsertLanguage`, data),

      ]);

    }));

  });

};
