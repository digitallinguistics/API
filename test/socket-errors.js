/* eslint-disable
  camelcase,
  func-names,
  handle-callback-err,
  max-nested-callbacks,
  max-statements-per-line,
  prefer-arrow-callback,
*/

const config   = require(`../lib/config`);
const getToken = require(`./token`);
const io       = require(`socket.io-client`);
const { client: db, coll } = require(`../lib/modules/db`);

module.exports = (v = ``) => {

  const authenticate = token => new Promise((resolve, reject) => {

    const socketOpts = { transports: [`websocket`, `xhr-polling`] };
    const client     = io(`${config.baseUrl}${v}`, socketOpts);

    client.on(`authenticated`, () => resolve(client));
    client.on(`connect`, () => client.emit(`authenticate`, { token }));
    client.on(`error`, reject);
    client.on(`unauthorized`, reject);

    resolve(client);

  });

  const test     = true;
  const testData = `test data`;

  describe(`Socket.IO`, function() {

    beforeAll(function(done) {
      getToken()
      .then(authenticate)
      .then(client => { this.client = client; })
      .then(done)
      .catch(fail);
    });

    xit(`401: Unauthorized`, function(done) {

      const socketOpts = { transports: [`websocket`, `xhr-polling`] };
      const client     = io(`${config.baseUrl}${v}`, socketOpts);

      client.on(`error`, err => {
        expect(err.status).toBe(401);
        done();
      });

      client.emit(`test`, testData);

    });

    it(`403: Bad user permissions`, function(done) {

      const lang = { test };

      db.upsertDocument(coll, lang, (err, doc) => {

        if (err) fail(err);

        this.client.emit(`get:language`, doc.id, err => {
          console.error(err);
          expect(err.status).toBe(403);
          done();
        });

      });

    });

    xit(`403: Bad scope`, function(done) {

    });

    xit(`404: No such event`, function(done) {

    });

    xit(`412: Precondition failed`, function(done) {

    });

    xit(`422: Malformed data`, function(done) {

    });

    xit(`echoes test data`, function(done) {

      this.client.emit(`test`, testData, (err, res) => {
        expect(res).toBe(testData);
        done();
      });

    });

  });

};
