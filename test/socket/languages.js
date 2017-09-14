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

const test = true;

const permissions = {
  contributors: [],
  owners:       [config.testUser],
  public:       false,
  viewers:      [],
};

const defaultData = {
  name: {},
  permissions,
  test,
  type: `Language`,
};

module.exports = (v = ``) => {

  describe(`Languages`, function() {

    let client;
    let emit;
    let token;

    beforeAll(testAsync(async function() {
      token  = await getToken();
      client = await authenticate(v, token);
      emit   = client.emitAsync;
      client.on(`error`, console.error);
    }));

    describe(`addLanguage`, function() {

      it(`403: Unauthorized (bad scope)`, testAsync(async function() {

        const badToken = await getBadToken();
        const client   = await authenticate(v, badToken);
        const emit     = client.emitAsync;

        try {
          await emit(`addLanguage`);
          fail();
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`422: Malformed Data`, testAsync(async function() {

        const data = Object.assign({}, defaultData, { name: true });

        try {
          await emit(`addLanguage`, data);
          fail();
        } catch (e) {
          expect(e.status).toBe(422);
        }

      }));

      it(`201: Created`, testAsync(async function() {

        const data = Object.assign({ id: uuid(), tid: `addLanguage` }, defaultData);
        const { res: lang, info } = await emit(`addLanguage`, data);

        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(lang.id).not.toBe(data.id); // any provided ID should be deleted
        expect(lang.type).toBe(`Language`);
        expect(lang._attachments).toBeUndefined();
        expect(lang._rid).toBeUndefined();
        expect(lang._self).toBeUndefined();
        expect(lang.permissions).toBeUndefined();
        expect(lang.ttl).toBeUndefined();

      }));

      it(`201: Created (missing body)`, testAsync(async function() {

        const { res: lang, info } = await emit(`addLanguage`);

        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(lang.type).toBe(`Language`);
        expect(lang._attachments).toBeUndefined();
        expect(lang._rid).toBeUndefined();
        expect(lang._self).toBeUndefined();
        expect(lang.permissions).toBeUndefined();
        expect(lang.ttl).toBeUndefined();

      }));

    });

    describe(`deleteLanguage`, function() {

      it(`400: bad options`, testAsync(async function() {

        const data = Object.assign({}, defaultData);
        const lang = await upsert(coll, data);

        try {
          await emit(`deleteLanguage`, lang.id, true);
          fail();
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ifMatch`, testAsync(async function() {

        const data = Object.assign({}, defaultData);
        const lang = await upsert(coll, data);

        try {
          await emit(`deleteLanguage`, lang.id, { ifMatch: true });
          fail();
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`403: Unauthorized (bad scope)`, testAsync(async function() {

        const badToken = await getBadToken();
        const client   = await authenticate(v, badToken);
        const emit     = client.emitAsync;
        const data     = Object.assign({}, defaultData);
        const lang     = await upsert(coll, data);

        try {
          await emit(`deleteLanguage`, lang.id);
          fail();
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          permissions: { owners: [`some-other-user`] },
        });
        const lang = await upsert(coll, data);

        try {
          await emit(`deleteLanguage`, lang.id);
          fail();
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Not Found`, testAsync(async function() {
        try {
          await emit(`deleteLanguage`, `bad-id`);
          fail();
        } catch (e) {
          expect(e.status).toBe(404);
        }
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `ifMatch` }, defaultData);
        const lang = await upsert(coll, data);

        // update data on server
        lang.changedProperty = true;
        await upsert(coll, lang);

        try {
          await emit(`deleteLanguage`, lang.id, { ifMatch: lang._etag });
          fail();
        } catch (e) {
          expect(e.status).toBe(412);
        }

      }));

      it(`204: Deleted`, testAsync(async function() {

        // add test Language
        const data = Object.assign({ tid: `deleteLanguage` }, defaultData);
        const lang = await upsert(coll, data);

        // add test Lexeme
        const lexeme = {
          languageID: lang.id,
          lemma: {},
          permissions,
          senses: [],
          test,
          type: `Lexeme`,
        };

        const lex = await upsert(coll, lexeme);

        // delete Language
        const { info } = await emit(`deleteLanguage`, lang.id);

        // check response
        expect(info.status).toBe(204);

        // check that Language is deleted on server
        const serverLang = await read(lang._self);
        expect(serverLang.ttl).toBeDefined();

        // check that associated Lexeme is deleted on server
        const serverLex = await read(lex._self);
        expect(serverLex.ttl).toBeDefined();

      }));

      it(`204: Deleted (already deleted item)`, testAsync(async function() {

        // add test Language
        const data = Object.assign({ tid: `deleteLanguage`, ttl: 300 }, defaultData);
        const lang = await upsert(coll, data);

        // redelete Language
        await emit(`deleteLanguage`, lang.id);

        // check data on server
        const res = await read(lang._self);
        expect(res.ttl).toBeDefined();

      }));

      it(`ifMatch`, testAsync(async function() {

        // add test Language
        const data = Object.assign({ tid: `deleteLanguage - If-Match` }, defaultData);
        const lang = await upsert(coll, data);

        // delete Language using ifMatch option
        await emit(`deleteLanguage`, lang.id, { ifMatch: lang._etag });

        // check data on server
        const res = await read(lang._self);
        expect(res.ttl).toBeDefined();

      }));

    });

    describe(`getLanguage`, function() {

      it(`304: Not Modified (ifNoneMatch)`, testAsync(async function() {
        // body...
      }));

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad languageID`, testAsync(async function() {
        // body...
      }));

      it(`400: bad ifNoneMatch`, testAsync(async function() {
        // body...
      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {
        // body...
      }));

      it(`404: Not Found`, testAsync(async function() {
        // body...
      }));

      it(`410: Gone`, testAsync(async function() {
        // body...
      }));

      it(`200: Success`, testAsync(async function() {
        // body...
      }));

      it(`200: Success (public Language)`, testAsync(async function() {
        // body...
      }));

    });

    describe(`getLanguages`, function() {

      it(`bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad continuation`, testAsync(async function() {
        // body...
      }));

      it(`400: bad ifModifiedSince`, testAsync(async function() {
        // body...
      }));

      it(`400: bad maxItems`, testAsync(async function() {
        // body...
      }));

      it(`400: bad public option`, testAsync(async function() {
        // body...
      }));

      it(`200: Success`, testAsync(async function() {
        // does not include public results
        // does not include private results
        // includes private results where user is Viewer but not Owner/Contributor
      }));

      it(`ifModifiedSince`, testAsync(async function() {
        // test
      }));

    });

    describe(`updateLanguage`, function() {

      it(`400: bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifMatch`, testAsync(async function() {
        // body...
      }));

      it(`400: missing languageID`, testAsync(async function() {
        // body...
      }));

      it(`403: Unauthorized (bad scope)`, testAsync(async function() {
        const badToken = await getBadToken();
      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {
        // test
      }));

      it(`404: NotFound`, testAsync(async function() {
        // test
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {
        // test
      }));

      it(`422: Malformed data`, testAsync(async function() {
        // test
      }));

      it(`200: Updated`, testAsync(async function() {
        // test
      }));

      it(`200: Undeleted`, testAsync(async function() {
        // test
      }));

      it(`200: Updated (missing body)`, testAsync(async function() {
        // test
      }));

      it(`ifMatch`, testAsync(async function() {
        // test
      }));

    });

    describe(`upsertLanguage`, function() {

      it(`bad options`, testAsync(async function() {
        // test
      }));

      it(`400: bad ifMatch`, testAsync(async function() {
        // test
      }));

      it(`403: Unauthorized (bad scope)`, testAsync(async function() {
        const badToken = await getBadToken();
      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {
        // test
      }));

      it(`404: Not Found`, testAsync(async function() {
        // test
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {
        // test
      }));

      it(`422: Malformed Data`, testAsync(async function() {
        // test
      }));

      it(`201: Create`, testAsync(async function() {
        // missing body
      }));

      it(`201: Replace`, testAsync(async function() {
        // test
      }));

      it(`201: Undelete`, testAsync(async function() {
        // test
      }));

      it(`ifMatch`, testAsync(async function() {
        // test
      }));

    });

  });

};

// describe(`Languages`, function() {
//
//   it(`add`, testAsync(async function() {
//     const data = Object.assign({ tid: `add` }, defaultData);
//     const { res }  = await emit(`addLanguage`, data);
//     expect(res.tid).toBe(data.tid);
//   }));
//
//   it(`delete`, testAsync(async function() {
//
//     // add test data
//     const lang = await upsert(coll, Object.assign({}, defaultData));
//
//     const lexData = {
//       languageID: lang.id,
//       lemma:      {},
//       permissions,
//       senses:     [],
//       test,
//       type:       `Lexeme`,
//     };
//
//     const lex = await upsert(coll, lexData);
//
//     // delete Language
//     const { res } = await emit(`deleteLanguage`, lang.id);
//     expect(res.status).toBe(204);
//
//     // check that Language has been deleted
//     const langCheck = await read(lang._self);
//     expect(langCheck.ttl).toBeDefined();
//
//     // check that Lexeme has been deleted
//     const lexemeCheck = await read(lex._self);
//     expect(lexemeCheck.ttl).toBeDefined();
//
//   }));
//
//   it(`get`, testAsync(async function() {
//
//     const doc  = await upsert(coll, Object.assign({ tid: `get` }, defaultData));
//     const { res: lang } = await emit(`getLanguage`, doc.id);
//
//     expect(lang.tid).toBe(`get`);
//
//   }));
//
//   it(`getAll`, testAsync(async function() {
//
//     const data = {
//       name: {},
//       permissions: { owner: [`some-other-user`] },
//       test,
//       tid: `getAll`,
//       type,
//     };
//
//     const doc = await upsert(coll, data);
//     await upsert(coll, Object.assign({}, defaultData));
//     const { res, info } = await emit(`getLanguages`);
//
//     expect(res.length).toBeGreaterThan(0);
//     expect(info.itemCount).toBeGreaterThan(0);
//     expect(res.some(item => item.tid === doc.tid)).toBe(false);
//
//   }));
//
//   it(`update`, testAsync(async function() {
//
//     const data = Object.assign({
//       notChanged: `This property should not be changed.`,
//       tid:        `upsertOne`,
//     }, defaultData);
//
//     const doc = await upsert(coll, data);
//
//     const newData = {
//       id: doc.id,
//       test,
//       tid: `upsertOneAgain`,
//       type,
//     };
//
//     const { res } = await emit(`updateLanguage`, newData);
//
//     expect(res.notChanged).toBe(doc.notChanged);
//     expect(res.tid).toBe(newData.tid);
//
//   }));
//
//   it(`upsert`, testAsync(async function() {
//     const data = Object.assign({ tid: `upsert` }, defaultData);
//     const { res } = await emit(`upsertLanguage`, data);
//     expect(res.tid).toBe(data.tid);
//   }));
//
// });
