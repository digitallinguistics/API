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

module.exports = (v = ``) => {

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

  describe(`Socket API`, function() {

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
      pending(`Not yet implemented.`);
      done();
    });

    it(`403: Bad scope`, function(done) {
      pending(`Not yet implemented.`);
      done();
    });

    it(`404: No such event`, function(done) {
      client.emit(`404: No such event`, err => {
        expect(err.status).toBe(404);
        done();
      });
    });

    it(`412: Precondition failed`, function(done) {
      pending(`Not yet implemented.`);
      done();
    });

    it(`422: Malformed data`, function(done) {
      pending(`Not yet implemented.`);
      done();
    });

  });

};
