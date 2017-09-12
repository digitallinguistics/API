/* eslint-disable
  func-names,
  no-invalid-this,
  prefer-arrow-callback,
*/

const errors    = require('./errors');
const general   = require('./general');
const languages = require('./languages');
const lexemes   = require('./lexemes');

module.exports = req => {

  describe(`REST API`, function() {

    errors(req);
    errors(req, `/v0`);

    general(req);
    general(req, `/v0`);

    languages(req);
    languages(req, `/v0`);

    lexemes(req);
    lexemes(req, `/v0`);

  });

};
