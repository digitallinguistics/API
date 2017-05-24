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

  const test     = true;
  const testData = `test data`;

  const authenticate = token => new Promise((resolve, reject) => {

    const socketOpts = { transports: [`websocket`, `xhr-polling`] };
    const client     = io(`${config.baseUrl}${v}`, socketOpts);

    client.on(`authenticated`, () => resolve(client));
    client.on(`connect`, () => client.emit(`authenticate`, { token }));
    client.on(`error`, reject);
    client.on(`unauthorized`, reject);

    resolve(client);

  });

  describe(`Socket API`, function() {

    beforeAll(function(done) {
      getToken()
      .then(authenticate)
      .then(client => { this.client = client; })
      .then(done)
      .catch(fail);
    });

  });

  it(`401: Unauthorized`, function(done) {

    const socketOpts = { transports: [`websocket`, `xhr-polling`] };
    const client     = io(`${config.baseUrl}${v}`, socketOpts);

    client.on(`error`, err => {
      expect(err.status).toBe(401);
      done();
    });

    client.emit(`test`, testData);

  });

};
