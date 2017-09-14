/* eslint-disable
  func-names,
  max-nested-callbacks,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');
const uuid   = require('uuid/v4');

const {
  authenticate,
  db,
  getToken,
  testAsync,
} = require('../utilities');

const { coll, upsert } = db;

const languageID = uuid();
const test       = true;

const permissions = {
  contributors: [],
  owners:       [config.testUser],
  public:       false,
  viewers:      [],
};

module.exports = (v = ``) => {

  describe(`Lexemes`, function() {

    const defaultData = {
      languageID,
      lemma: {},
      permissions,
      test,
      type: `Lexeme`,
    };

    let lang = {
      id: languageID,
      name: {},
      permissions,
      test,
      type: `Language`,
    };

    let token;
    let client;
    let emit;

    beforeAll(testAsync(async function() {

      token  = await getToken();
      client = await authenticate(v, token);
      emit   = client.emitAsync;

      lang = await upsert(coll, lang);

    }));

    describe(`addLexeme`, function() {

      it(`400: missing languageID`, testAsync(async function() {
        // test
      }));

      it(`400: bad languageID`, testAsync(async function() {
        // test
      }));

      it(`403: bad scope`, testAsync(async function() {
        // test
      }));

      it(`403: bad permissions on Language`, testAsync(async function() {
        // test
      }));

      it(`404: Language not found`, testAsync(async function() {
        // test
      }));

      it(`422: Malformed data`, testAsync(async function() {
        // test
      }));

      it(`201: Created (body provided)`, testAsync(async function() {
        // test
      }));

      it(`201: Created (body missing)`, testAsync(async function() {
        // test
      }));

    });

    describe(`deleteLexeme`, function() {

    });

    describe(`getLexeme`, function() {

    });

    describe(`getLexemes`, function() {

    });

    describe(`updateLexeme`, function() {

    });

    describe(`upsertLexeme`, function() {

    });

  });

};
