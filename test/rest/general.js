/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-invalid-this,
  no-magic-numbers,
  no-underscore-dangle,
  prefer-arrow-callback,
*/

const agent  = require('superagent');

const {
  getToken,
  testAsync,
} = require('../utilities');

module.exports = (req, v = ``) => {

  describe(`General`, function() {

    let token;

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    it(`HTTP > HTTPS`, testAsync(async function() {
      try {
        await agent.get(`http://api.digitallinguistics.io${v}/test`)
        .set(`Authorization`, `Bearer ${token}`);
      } catch (err) {
        expect(err.response.redirects[0].includes(`https`));
      }
    }));

  });

};
