/* eslint-disable
  func-names,
  prefer-arrow-callback,
*/

const errors    = require('./errors');
const general   = require('./general');
const languages = require('./languages');

module.exports = req => {

  describe(`Socket API`, function() {

    errors();
    errors(`/v0`);

    general(req);
    general(req, `/v0`);

    languages();
    languages(`/v0`);

  });

};
