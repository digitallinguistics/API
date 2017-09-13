/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-invalid-this,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const config = require('../../lib/config');
const http   = require('http');

const {
  getToken,
  jwt,
  testAsync,
  timeout,
} = require('../utilities');

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = ``) => {

  describe(`Errors`, function() {

    let token;

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    it(`401: Unauthorized`, testAsync(async function() {

      const res = await req.get(`${v}/languages`)
      .expect(401);

      expect(res.headers[`www-authenticate`]).toBeDefined();
      expect(res.body.error).toBe(`credentials_required`);

    }));

    it(`404: No Route`, testAsync(async function() {
      await req.get(`${v}/badroute`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(404);
    }));

    it(`419: Authorization Token Expired`, testAsync(async function() {

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

      await req.get(`${v}/badroute`)
      .set(`Authorization`, `Bearer ${expiredToken}`)
      .expect(419);

    }));

    it(`429: Too Many Requests`, function(done) {

      pending(`Only run this test as needed.`);

      const opts = {
        headers: { Authorization: `Bearer ${token}` },
        path: `${v}/test`,
        port: config.port,
      };

      const test = () => new Promise((resolve, reject) => {
        const req = http.get(opts, res => {
          if (res.statusCode === 200) resolve();
          else if (res.statusCode === 429) done();
        });
        req.on(`error`, reject);
      });

      const arr   = Array(750).fill({});
      const tasks = arr.map(test);

      Promise.all(tasks)
      .then(fail)
      .catch(fail);

    }, 10000);

  });

};
