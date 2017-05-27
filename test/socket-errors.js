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
const jwt            = require(`jsonwebtoken`);
const upsertDocument = require(`./upsert`);
const { client: db, coll } = require(`../lib/db`);

module.exports = (v = ``) => {

  describe(`Socket Errors`, function() {

    let client;
    const test     = true;
    const testData = `test data`;

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
      .then(authenticate)
      .then(result => { client = result; })
      .then(done)
      .catch(fail);
    });

    it(`401: Unauthorized`, function(done) {

      const socketOpts = { transports: [`websocket`, `xhr-polling`] };
      const client     = io(`${config.baseUrl}${v}`, socketOpts);

      client.on(`error`, err => {
        expect(err.status).toBe(401);
        done();
      });

      client.emit(`401: Unauthorized`, testData);

    });

    it(`403: Bad user permissions`, function(done) {

      const lang = {
        test,
        type: `Language`,
      };

      db.upsertDocument(coll, lang, (err, doc) => {

        if (err) fail(err);

        client.emit(`get`, doc.id, err => {
          expect(err.status).toBe(403);
          done();
        });

      });

    });

    it(`403: Bad scope`, function(done) {

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

        const data = {
          permissions: { owner: [config.testUser] },
          test,
          testName: `403: Bad scope`,
        };

        const destroy = client => new Promise((resolve, reject) => {
          client.emit(`delete`, data.id, (err, res) => {
            expect(res).toBeUndefined();
            if (err) expect(err.status).toBe(403);
            if (err) resolve();
            else reject();
          });
        });

        upsertDocument(data)
        .then(lang => { data.id = lang.id; })
        .then(() => authenticate(token))
        .then(destroy)
        .then(done)
        .catch(fail);

      });

    });

    it(`404: No such event`, function(done) {
      client.emit(`404: No such event`, err => {
        expect(err.status).toBe(404);
        done();
      });
    });

    it(`412: Precondition failed`, function(done) {

      const lang = {
        permissions: { owner: [config.testUser] },
        ttl: 500,
        type: `Language`,
      };

      const badDelete = lang => new Promise((resolve, reject) => {
        client.emit(`delete`, lang.id, { ifMatch: `bad-etag` }, (err, res) => {
          expect(res).toBeUndefined();
          expect(err.status).toBe(412);
          if (err) resolve();
          else reject();
        });
      });

      const badUpsert = lang => new Promise((resolve, reject) => {
        client.emit(`upsert`, lang, { ifMatch: `bad-etag` }, (err, res) => {
          expect(err.status).toBe(412);
          if (err) resolve(lang);
          else reject(res);
        });
      });

      upsertDocument(lang)
      .then(badUpsert)
      // .then(badDelete)
      .then(done)
      .catch(fail);

    });

    it(`422: Malformed data`, function(done) {

      const lang = {
        name: true,
        test,
      };

      client.emit(`add`, `Language`, lang, err => {
        expect(err.status).toBe(422);
        done();
      });

    });

  });

};
