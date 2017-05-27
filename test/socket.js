/* eslint-disable
  camelcase,
  func-names,
  handle-callback-err,
  max-nested-callbacks,
  max-statements-per-line,
  prefer-arrow-callback,
*/

const config         = require(`../lib/config`);
const getToken       = require(`./token`);
const io             = require(`socket.io-client`);
const upsertDocument = require(`./upsert`);

module.exports = (req, v = ``) => {

  describe(`Socket API`, function() {

    let client;
    let token;
    const test = true;

    const authenticate = token => new Promise((resolve, reject) => {

      const socketOpts = { transports: [`websocket`, `xhr-polling`] };
      const client     = io(`${config.baseUrl}${v}`, socketOpts);

      client.on(`authenticated`, () => resolve(client));
      client.on(`connect`, () => client.emit(`authenticate`, { token }));
      client.on(`error`, reject);
      client.on(`unauthorized`, reject);

    });

    beforeAll(function(done) {
      getToken()
      .then(result => {
        token = result;
        return token;
      })
      .then(authenticate)
      .then(result => { client = result; })
      .then(done)
      .catch(fail);
    });

    // FEATURES
    it(`supports pagination`, function(done) {

      const getFirstPage = () => new Promise((resolve, reject) => {
        client.emit(`getAll`, `Language`, { maxItemCount: 10 }, (err, res, info) => {
          if (err) return reject(err);
          expect(res.length).toBe(10);
          expect(info.continuation).toBeDefined();
          resolve(info.continuation);
        });
      });

      const getSecondPage = continuation => new Promise((resolve, reject) => {
        client.emit(`getAll`, `Language`, { continuation }, (err, res) => {
          expect(res.length).toBeGreaterThan(0);
          if (err) reject(err);
          else resolve();
        });
      });

      Array(15)
      .fill({})
      .reduce(p => p.then(() => upsertDocument({
        permissions: { public: true },
        test: true,
        type: `Language`,
      })), Promise.resolve())
      .then(getFirstPage)
      .then(getSecondPage)
      .then(done)
      .catch(fail);

    }, 10000);

    it(`304: Not Modified`, function(done) {

      const lang = {
        permissions: { public: true },
        test: true,
        // don't set a ttl here
      };

      const testETag = data => new Promise((resolve, reject) => {
        client.emit(`get`, `Language`, data.id, { ifNoneMatch: data._etag }, (err, res) => {
          expect(err.status).toBe(304);
          if (err) resolve();
          else reject(res);
        });
      });

      upsertDocument(lang)
      .then(testETag)
      .then(done)
      .catch(fail);

    });

    // GENERIC CRUD METHODS

    it(`add`, function(done) {

      const lang = {
        test,
        testName: `add`,
      };

      client.emit(`add`, `Language`, lang, (err, res) => {
        expect(res.testName).toBe(lang.testName);
        done();
      });

    });

    it(`delete`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `delete`,
      };

      const destroy = id => new Promise((resolve, reject) => {
        client.emit(`delete`, id, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });

      upsertDocument(data)
      .then(lang => destroy(lang.id))
      .then(done)
      .catch(fail);

    });

    it(`get`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `delete`,
      };

      const get = id => new Promise((resolve, reject) => {
        client.emit(`get`, `Language`, id, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });

      upsertDocument(data)
      .then(lang => get(lang.id))
      .then(done)
      .catch(fail);

    });

    it(`getAll`, function(done) {

      const lang1 = {
        permissions: { owner: [`some-other-user`] },
        test: true,
        testName: `GET languages test`,
      };

      const lang2 = {
        permissions: { public: true },
        test: true,
      };

      const filter = results => results.filter(item => item.testName === lang1.testName);

      const getAll = () => new Promise((resolve, reject) => {
        client.emit(`getAll`, `Language`, (err, res) => {
          if (err) return reject(err);
          expect(res.length).toBeGreaterThan(0);
          expect(filter(res).length).toBe(0);
          resolve();
        });
      });

      upsertDocument(lang1)
      .then(() => upsertDocument(lang2))
      .then(getAll)
      .then(done)
      .catch(fail);

    });

    it(`update`, function(done) {

      const lang = {
        notChanged: `This property should not be changed.`,
        permissions: { owner: [config.testUser] },
        testName: `upsertOne`,
        ttl: 500,
      };

      const update = data => new Promise((resolve, reject) => {

        const newData = {
          id: data.id,
          testName: `upsertOneAgain`,
        };

        client.emit(`update`, `Language`, newData, (err, res) => {
          if (err) reject(err);
          expect(res.notChanged).toBe(lang.notChanged);
          expect(res.testName).toBe(newData.testName);
          resolve(res);
        });

      });

      upsertDocument(lang)
      .then(update)
      .then(done)
      .catch(fail);

    });

    it(`upsert`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        testName: `upsert`,
        ttl: 500,
      };

      client.emit(`upsert`, `Language`, lang, (err, res) => {
        expect(res.testName).toBe(lang.testName);
        done();
      });

    });

    it(`receives new data (REST)`, function(done) {

      const data = {
        test,
        testName: `receives new data (REST)`,
      };

      const add = () => req.post(`${v}/languages`)
      .send(data)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(201);

      authenticate(token)
      .then(client => client.on(`add`, id => {
        expect(typeof id).toBe(`string`);
        client.close();
        done();
      }))
      .then(add)
      .catch(fail);

    });

    it(`receives new data (Socket)`, function(done) {

      const data = {
        test,
        testName: `receives new data (Socket)`,
      };

      authenticate(token)
      .then(client1 => client1.on(`add`, id => {
        expect(typeof id).toBe(`string`);
        client1.close();
        done();
      }))
      .then(() => authenticate(token))
      .then(client2 => client2.emit(`addLanguage`, data))
      .catch(fail);

    });

    it(`receives deleted data (REST)`, function(done) {

      const deleteDocument = id => req.delete(`${v}/languages/${id}`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(204);

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `receive delete event (REST)`,
      };

      upsertDocument(data)
      .then(lang => { data.id = lang.id; })
      .then(() => authenticate(token))
      .then(client => client.on(`delete`, id => {
        expect(id).toBe(data.id);
        client.close();
        done();
      }))
      .then(() => deleteDocument(data.id))
      .catch(fail);

    });

    it(`receives deleted data (Socket)`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `receive delete event (Socket)`,
      };

      upsertDocument(data)
      .then(lang => { data.id = lang.id; })
      .then(() => authenticate(token))
      .then(client2 => client2.on(`delete`, id => {
        expect(id).toBe(data.id);
        client2.close();
        done();
      }))
      .then(() => client.emit(`deleteLanguage`, data.id))
      .catch(fail);

    });

    it(`receives updated data (REST)`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `receive updated data (REST)`,
      };

      const update = () => req.patch(`${v}/languages/${data.id}`)
      .send(data)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(200);

      upsertDocument(data)
      .then(lang => { data.id = lang.id; })
      .then(() => authenticate(token))
      .then(client => client.on(`update`, result => {
        expect(result).toBe(data.id);
        client.close();
        done();
      }))
      .then(update)
      .catch(fail);

    });

    it(`receives updated data (Socket)`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `receive updated data (Socket)`,
      };

      upsertDocument(data)
      .then(lang => { data.id = lang.id; })
      .then(() => authenticate(token))
      .then(client2 => client2.on(`update`, id => {
        expect(id).toBe(data.id);
        client2.close();
        done();
      }))
      .then(() => client.emit(`updateLanguage`, data))
      .catch(fail);

    });

    it(`receives upserted data (REST)`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `receive upserted data (REST)`,
      };

      const upsert = () => req.put(`${v}/languages`)
      .send(data)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(201);

      upsertDocument(data)
      .then(lang => { data.id = lang.id; })
      .then(() => authenticate(token))
      .then(client => client.on(`upsert`, result => {
        expect(result).toBe(data.id);
        client.close();
        done();
      }))
      .then(upsert)
      .catch(fail);

    });

    it(`receives upserted data (Socket)`, function(done) {

      const data = {
        permissions: { owner: [config.testUser] },
        test,
        testName: `receive upserted data (Socket)`,
      };

      authenticate(token)
      .then(client2 => client2.on(`upsert`, id => {
        expect(typeof id).toBe(`string`);
        client2.close();
        done();
      }))
      .then(() => client.emit(`upsertLanguage`, data))
      .catch(fail);

    });

  });

};
