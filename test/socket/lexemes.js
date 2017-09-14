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

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

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

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad ID`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifMatch`, testAsync(async function() {
        // test
      }));

      it(`403: bad scope`, testAsync(async function() {
        // test
      }));

      it(`403: bad permissions on Lexeme`, testAsync(async function() {
        // test
      }));

      it(`404: Lexeme not found`, testAsync(async function() {
        // test
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {
        // test
      }));

      it(`204: Deleted`, testAsync(async function() {
        // test
      }));

      it(`204: Redeleted`, testAsync(async function() {
        // test
      }));

      it(`ifMatch`, testAsync(async function() {
        // test
      }));

    });

    describe(`getLexeme`, function() {

      it(`304: Not Modified`, testAsync(async function() {
        // test
      }));

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifNoneMatch`, testAsync(async function() {
        // test
      }));

      it(`403: bad permissions for Lexeme`, testAsync(async function() {
        // test
      }));

      it(`404: Lexeme Not Found`, testAsync(async function() {
        // test
      }));

      it(`410: Gone`, testAsync(async function() {
        // test
      }));

      it(`200: Success (owner Lexeme)`, testAsync(async function() {
        // test
      }));

      it(`200: Success (public Lexeme)`, testAsync(async function() {
        // test
      }));

      it(`200: Success (viewer Lexeme)`, testAsync(async function() {
        // test
      }));

      it(`ifNoneMatch`, testAsync(async function() {
        // test
      }));

    });

    describe(`getLexemes`, function() {

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad continuation`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifModifiedSince`, testAsync(async function() {
        // test
      }));

      it(`400: bad languageID`, testAsync(async function() {
        // test
      }));

      it(`400: bad maxItemCount`, testAsync(async function() {
        // test
      }));

      it(`400: bad public option`, testAsync(async function() {
        // test
      }));

      it(`200: Success`, testAsync(async function() {
        // private lexeme not included
        // public lexeme not included
        // viewer lexeme included
        // owner lexeme included
      }));

      it(`public option`, testAsync(async function() {
        // private lexeme not included
        // public lexeme included
        // viewer lexeme included
        // owner lexeme included
      }));

    });

    describe(`updateLexeme`, function() {

      it(`missing ID`, testAsync(async function() {
        // test
      }));

      it(`400: bad ID`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifMatch`, testAsync(async function() {
        // test
      }));

      it(`403: bad scope`, testAsync(async function() {
        // test
      }));

      it(`404: Lexeme not found`, testAsync(async function() {
        // test
      }));

      it(`403: bad permissions for Lexeme`, testAsync(async function() {
        // test
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {
        // test
      }));

      it(`422: Malformed data`, testAsync(async function() {
        // test
      }));

      it(`200: Update`, testAsync(async function() {
        // test
      }));

      it(`200: Undelete`, testAsync(async function() {
        // test
      }));

      it(`200: No languageID`, testAsync(async function() {
        // update handlers to retrieve item if no languageID is provided
      }));

      it(`ifMatch option`, testAsync(async function() {
        // test
      }));

    });

    describe(`upsertLexeme`, function() {

    });

  });

};
