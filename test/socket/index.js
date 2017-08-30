/* eslint-disable
  func-names,
  prefer-arrow-callback,
*/

const errors    = require('./errors');
const general   = require('./general');
const languages = require('./languages');
const lexemes   = require('./lexemes');

module.exports = req => {

  describe(`Socket API`, function() {

    errors();
    errors(`/v0`);

    general(req);
    general(req, `/v0`);

    languages();
    languages(`/v0`);

    lexemes();
    lexemes(`/v0`);

  });

};
