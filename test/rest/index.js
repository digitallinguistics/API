/* eslint-disable
  func-names,
  no-invalid-this,
  prefer-arrow-callback,
*/

const errors    = require('./errors');
const general   = require('./general');
const languages = require('./languages');

const {
  getToken,
  testAsync,
} = require('../utilities');

module.exports = req => {

  describe(`REST API`, function() {

    beforeAll(testAsync(async function() {
      this.token = await getToken();
    }));

    errors(req);
    errors(req, `/v0`);

    general(req);
    general(req, `/v0`);

    languages(req);
    languages(req, `/v0`);

  });

};
