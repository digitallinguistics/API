/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-magic-numbers,
  no-shadow,
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

module.exports = (req, v = ``) => {

  describe(`General`, function() {

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

    it(`can authenticate twice`, function(done) {
      client.on(`authenticated`, done);
      client.on(`error`, fail);
      client.on(`unauthorized`, fail);
      client.emit(`authenticate`, { token }, done);
    });

    it(`maxItemCount`, testAsync(async function() {

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

    it(`receives deleted data (REST)`, testAsync(async function() {

      const client = await authenticate(v, token);
      const doc    = await upsert(coll, Object.assign({}, defaultData));

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

      const doc          = await upsert(coll, Object.assign({}, defaultData));
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

      const data = Object.assign({}, Object.assign({}, defaultData));
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

    it(`304: Not Modified`, testAsync(async function() {

      const data = Object.assign({}, defaultData);
      const doc  = await upsert(coll, data);

      try {
        await emit(`get`, doc.id, { ifNoneMatch: doc._etag });
      } catch (e) {
        expect(e.status).toBe(304);
      }

    }));

  });

};
