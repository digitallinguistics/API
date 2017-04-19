/* eslint-disable
  camelcase,
  func-names,
  max-nested-callbacks,
  max-statements-per-line,
  prefer-arrow-callback,
*/

const config   = require(`../lib/config`);
const getToken = require(`./token`);
const io       = require(`socket.io-client`);

module.exports = (v = ``) => {

  const authenticate = token => new Promise((resolve, reject) => {

    const socketOpts = { transports: [`websocket`, `xhr-polling`] };
    const client     = io.connect(`${config.baseUrl}${v}`, socketOpts);

    client.on(`authenticated`, () => resolve(client));
    client.on(`connect`, () => client.emit(`authenticate`, { token }));
    client.on(`error`, reject);
    client.on(`unauthorized`, reject);

    resolve(client);

  });

  describe(`Socket.IO`, function() {

    beforeAll(function(done) {
      getToken()
      .then(authenticate)
      .then(client => { this.client = client; })
      .then(done)
      .catch(fail);
    });

    it(`echoes test data`, function(done) {

      const testData = `test data`;

      this.client.emit(`test`, testData, res => {
        expect(res).toBe(testData);
        done();
      });

    });

    it(`returns an error when not authenticated`, function() {
    });

    it(`upsert:languages (one language)`, function() {
    });

    it(`upsert:languages (multiple languages)`, function() {
    });

    it(`upsert:language`, function() {
    });

    it(`get:languages`, function() {
    });

    it(`get:languages | ids`, function() {
    });

    it(`get:language`, function() {
    });

    it(`delete:language`, function() {
    });

    it(`delete:languages`, function() {
    });

  });

};
