/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-shadow,
  prefer-arrow-callback,
*/

const config        = require('../../lib/config');
const io            = require('socket.io-client');
const { promisify } = require('util');

const {
  authenticate,
  getToken,
  jwt,
  testAsync,
  timeout,
} = require('../utilities');

module.exports = (v = ``) => {

  describe(`Errors`, function() {

    let client;
    let emit;

    beforeAll(testAsync(async function() {
      const token = await getToken();
      client      = await authenticate(v, token);
      emit        = promisify(client.emit).bind(client);
    }));

    it(`401: Unauthorized`, function(done) {

      const socketOpts = { transports: [`websocket`, `xhr-polling`] };
      const client     = io(`${config.baseURL}${v}`, socketOpts);

      client.on(`error`, err => {
        expect(err.status).toBe(401);
        done();
      });

      client.emit(`unauthorized event`, {});

    });

    it(`404: No such event`, testAsync(async function() {
      try {
        await emit(`bad event`);
        fail();
      } catch (e) {
        expect(e.status).toBe(404);
      }
    }));

    it(`419: Authorization token expired`, testAsync(async function() {

      const payload = {
        azp:   config.authClientID,
        scope: `user`,
      };

      const opts = {
        audience:  `https://api.digitallinguistics.io/`,
        expiresIn: 1,
        issuer:    `https://${config.authDomain}/`,
        subject:   config.testUser,
      };

      const expiredToken = await jwt.signJwt(payload, config.authSecret, opts);
      await timeout(1000);
      const socketOpts = { transports: [`websocket`, `xhr-polling`] };
      const client     = io(`${config.baseURL}${v}`, socketOpts);
      client.emit(`authenticate`, { expiredToken });
      await new Promise(resolve => client.on(`unauthorized`, resolve));

    }));

  });

};
