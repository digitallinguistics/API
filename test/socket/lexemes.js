/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-shadow,
  no-underscore-dangle,
  prefer-arrow-callback,
  sort-keys,
*/

const config = require('../../lib/config');
const uuid   = require('uuid/v4');

const {
  authenticate,
  db,
  getBadToken,
  getToken,
  testAsync,
} = require('../utilities');

const {
  coll,
  read,
  upsert,
} = db;

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

      // NOTE: Cannot check for bad options because of how the options argument is retrieved

      it(`400: missing languageID`, testAsync(async function() {

        const data = Object.assign({ tid: `missing languageID` }, defaultData);
        delete data.languageID;

        try {
          const { res } = await emit(`addLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad languageID`, testAsync(async function() {

        const data = Object.assign({}, defaultData, { languageID: true, tid: `bad languageID` });

        try {
          const { res } = await emit(`addLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`403: bad scope`, testAsync(async function() {

        const badToken = await getBadToken();
        const client   = await authenticate(v, badToken);
        const emit     = client.emitAsync;
        const data     = Object.assign({ tid: `bad scope` }, defaultData);

        try {
          const { res } = await emit(`addLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: bad permissions on Language`, testAsync(async function() {

        const langData = Object.assign({}, lang, {
          permissions: { owners: [`some-other-user`] },
        });
        delete langData.id;
        const language = await upsert(coll, langData);

        const data = Object.assign({}, defaultData, { languageID: language.id, tid: `bad permissions on Language` });

        try {
          const { res } = await emit(`addLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Language not found`, testAsync(async function() {

        const data = Object.assign({}, defaultData, { languageID: uuid(), tid: `Language not found` });

        try {
          const { res } = await emit(`addLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(404);
        }

      }));

      it(`422: Malformed data`, testAsync(async function() {

        const data = Object.assign({}, defaultData, { tid: `malformed data`, lemma: true });

        try {
          const { res } = await emit(`addLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(422);
        }

      }));

      it(`201: Created (body provided)`, testAsync(async function() {

        const data          = Object.assign({ id: uuid(), tid: `created (body provided)` }, defaultData);
        const { res, info } = await emit(`addLexeme`, data);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.id).not.toBe(data.id);
        expect(res.tid).toBe(data.tid);
        expect(res.type).toBe(`Lexeme`);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check server data
        const doc = await read(`${coll}/docs/${res.id}`);
        expect(doc.type).toBe(`Lexeme`);
        expect(doc.languageID).toBe(lang.id);
        expect(doc.tid).toBe(data.tid);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

      it(`201: Created (body missing)`, testAsync(async function() {

        const { res, info } = await emit(`addLexeme`, { languageID: lang.id });

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check server data
        const doc = await read(`${coll}/docs/${res.id}`);
        expect(doc.type).toBe(`Lexeme`);
        expect(doc.languageID).toBe(lang.id);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

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

      // NOTE: Various tests for upsert resulting in a create operation are tested in addLexeme rather than here

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifMatch`, testAsync(async function() {
        // test
      }));

      it(`403: bad scope`, testAsync(async function() {
        // test
      }));

      it(`403: bad permissions for Lexeme`, testAsync(async function() {
        // test
      }));

      it(`404: Lexeme not found`, testAsync(async function() {
        // test
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {
        // test
      }));

      it(`422: Malformed data`, testAsync(async function() {
        // test
      }));

      it(`201: Create`, testAsync(async function() {
        // test
      }));

      it(`201: Replace`, testAsync(async function() {
        // test
      }));

      it(`201: Undelete`, testAsync(async function() {
        // test
      }));

    });

  });

};
