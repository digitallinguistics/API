/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
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
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
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
        expect(res.id).toBe(data.id);
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

      let lexeme;

      // add a Lexeme for use with error testing
      // this ensures that the error is not due to the Lexeme not existing
      beforeAll(testAsync(async function() {
        const data = Object.assign({ tid: `test Lexeme` }, defaultData);
        lexeme     = await upsert(coll, data);
      }));

      it(`400: bad options`, testAsync(async function() {
        try {
          const { res } = await emit(`deleteLexeme`, lexeme.id, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: missing ID`, testAsync(async function() {
        try {
          const { res } = await emit(`deleteLexeme`);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad ID`, testAsync(async function() {
        try {
          const { res } = await emit(`deleteLexeme`, ``);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad ifMatch`, testAsync(async function() {
        try {
          const { res } = await emit(`deleteLexeme`, lexeme.id, { ifMatch: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`403: bad scope`, testAsync(async function() {

        const badToken = await getBadToken();
        const client   = await authenticate(v, badToken);
        const emit     = client.emitAsync;

        try {
          const { res } = await emit(`deleteLexeme`, lexeme.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: bad permissions on Lexeme`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `bad permissions on Lexeme`,
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });

        const lex = await upsert(coll, data);

        try {
          const { res } = await emit(`deleteLexeme`, lex.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Lexeme not found`, testAsync(async function() {
        try {
          const { res } = await emit(`deleteLexeme`, uuid());
          fail(res);
        } catch (e) {
          expect(e.status).toBe(404);
        }
      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `ifMatch` }, defaultData);
        const lex  = await upsert(coll, data);

        // update data on server
        lex.changedProperty = true;
        await upsert(coll, lex);

        try {
          const { res } = await emit(`deleteLexeme`, lex.id, { ifMatch: lex._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(412);
        }

      }));

      it(`204: Deleted`, testAsync(async function() {

        // add test Lexeme
        const data = Object.assign({ tid: `deleteLexeme` }, defaultData);
        const lex  = await upsert(coll, data);

        // delete Lexeme
        const { res, info } = await emit(`deleteLexeme`, lex.id);

        // check info & response
        expect(info.status).toBe(204);
        expect(res.status).toBe(204);

        // check that Lexeme is deleted on server
        const serverLex = await read(lex._self);
        expect(serverLex.ttl).toBeDefined();

      }));

      it(`204: Redeleted`, testAsync(async function() {

        // add test Lexeme
        const data = Object.assign({ tid: `deleteLexeme`, ttl: 300 }, defaultData);
        const lex  = await upsert(coll, data);

        // delete Lexeme
        const { res, info } = await emit(`deleteLexeme`, lex.id);

        // check info & response
        expect(info.status).toBe(204);
        expect(res.status).toBe(204);

        // check that Lexeme is deleted on server
        const serverLex = await read(lex._self);
        expect(serverLex.ttl).toBeDefined();

      }));

      it(`ifMatch`, testAsync(async function() {

        // add test Lexeme
        const data = Object.assign({ tid: `deleteLexeme` }, defaultData);
        const lex  = await upsert(coll, data);

        // delete Lexeme
        const { res, info } = await emit(`deleteLexeme`, lex.id, { ifMatch: lex._etag });

        // check info & response
        expect(info.status).toBe(204);
        expect(res.status).toBe(204);

        // check that Lexeme is deleted on server
        const serverLex = await read(lex._self);
        expect(serverLex.ttl).toBeDefined();

      }));

    });

    describe(`getLexeme`, function() {

      const data = Object.assign({ tid: `304` }, defaultData);
      let lex;

      // make test Lexeme available to all tests, to isolate the error
      beforeAll(testAsync(async function() {
        lex  = await upsert(coll, data);
      }));

      it(`304: Not Modified`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexeme`, lex.id, { ifNoneMatch: lex._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(304);
        }
      }));

      it(`400: bad options`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexeme`, lex.id, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad ifNoneMatch`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexeme`, lex.id, { ifNoneMatch: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`403: bad permissions for Lexeme`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `bad permissions for Lexeme`,
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });

        const lex = await upsert(coll, data);

        try {
          const { res } = await emit(`getLexeme`, lex.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Lexeme Not Found`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexeme`, uuid());
          fail(res);
        } catch (e) {
          expect(e.status).toBe(404);
        }
      }));

      it(`410: Gone`, testAsync(async function() {

        const data = Object.assign({ ttl: 300, tid: `410` }, defaultData);
        const lex  = await upsert(coll, data);

        try {
          const { res } = await emit(`getLexeme`, lex.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(410);
        }

      }));

      it(`200: Success (owner Lexeme)`, testAsync(async function() {

        const { res, info } = await emit(`getLexeme`, lex.id);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

      it(`200: Success (public Lexeme)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `public Lexeme`,
          permissions: Object.assign({}, permissions, {
            owners: [`some-other-user`],
            public: true,
          }),
        });

        const lex = await upsert(coll, data);

        const { res, info } = await emit(`getLexeme`, lex.id);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

      it(`200: Success (viewer Lexeme)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `public Lexeme`,
          permissions: Object.assign({}, permissions, {
            owners:  [`some-other-user`],
            public:  false,
            viewers: [config.testUser],
          }),
        });

        const lex = await upsert(coll, data);

        const { res, info } = await emit(`getLexeme`, lex.id);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

      it(`ifNoneMatch`, testAsync(async function() {

        // add test Lexeme
        const data = Object.assign({ tid: `ifNoneMatch` }, defaultData);
        const lex  = await upsert(coll, data);

        // update test Lexeme
        lex.changedProperty = true;
        await upsert(coll, lex);

        // get Lexeme with ifNoneMatch option
        const { res, info } = await emit(`getLexeme`, lex.id, { ifNoneMatch: lex._etag });

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

    });

    describe(`getLexemes`, function() {

      const privateData = Object.assign({}, defaultData, {
        tid: `privateData`,
        permissions: Object.assign({}, permissions, {
          owners: [`some-other-user`],
          public: false,
        }),
      });

      const publicData = Object.assign({}, defaultData, {
        tid: `publicData`,
        permissions: Object.assign({}, permissions, {
          owners: [`some-other-user`],
          public: true,
        }),
      });

      const viewerData = Object.assign({}, defaultData, {
        tid: `viewerData`,
        permissions: Object.assign({}, permissions, {
          owners:  [`some-other-user`],
          viewers: [config.testUser],
          public:  false,
        }),
      });

      const ownerData = Object.assign({ tid: `ownerData` }, defaultData);

      let privateLex;
      let publicLex;
      let viewerLex;
      let ownerLex;

      beforeAll(testAsync(async function() {
        privateLex = await upsert(coll, privateData);
        publicLex = await upsert(coll, publicData);
        viewerLex = await upsert(coll, viewerData);
        ownerLex = await upsert(coll, ownerData);
      }));

      it(`400: bad options`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexemes`, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad continuation`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexemes`, { continuation: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad ifModifiedSince`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexemes`, { ifModifiedSince: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad languageID`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexemes`, { languageID: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad maxItemCount`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexemes`, { maxItemCount: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad public option`, testAsync(async function() {
        try {
          const { res } = await emit(`getLexemes`, { public: `yes` });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`200: Success`, testAsync(async function() {

        const { res, info } = await emit(`getLexemes`);

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBeGreaterThan(0);

        // check Lexemes
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThan(0);

        expect(res.every(lex => lex.type === `Lexeme`
          && lex.languageID === lang.id
          && typeof lex._attachments === `undefined`
          && typeof lex._rid === `undefined`
          && typeof lex._self === `undefined`
          && typeof lex.permissions === `undefined`
          && typeof lex.ttl === `undefined`
        ));

        expect(res.find(lex => lex.id === privateLex.id)).toBeUndefined();
        expect(res.find(lex => lex.id === publicLex.id)).toBeUndefined();
        expect(res.find(lex => lex.id === viewerLex.id)).toBeDefined();
        expect(res.find(lex => lex.id === ownerLex.id)).toBeDefined();

      }));

      it(`public option`, testAsync(async function() {

        const { res, info } = await emit(`getLexemes`, { public: true });

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBeGreaterThan(0);

        // check Lexemes
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThan(0);

        expect(res.every(lex => lex.type === `Lexeme`
          && lex.languageID === lang.id
          && typeof lex._attachments === `undefined`
          && typeof lex._rid === `undefined`
          && typeof lex._self === `undefined`
          && typeof lex.permissions === `undefined`
          && typeof lex.ttl === `undefined`
        ));

        expect(res.find(lex => lex.id === privateLex.id)).toBeUndefined();
        expect(res.find(lex => lex.id === publicLex.id)).toBeDefined();
        expect(res.find(lex => lex.id === viewerLex.id)).toBeDefined();
        expect(res.find(lex => lex.id === ownerLex.id)).toBeDefined();

      }));

      it(`languageID option`, testAsync(async function() {

        let lang = {
          id: uuid(),
          name: {},
          permissions,
          test,
          type: `Language`,
        };

        lang = await upsert(coll, lang);

        const lex1 = await upsert(coll, Object.assign({}, defaultData, { languageID: lang.id }));
        const lex2 = await upsert(coll, Object.assign({}, defaultData, { languageID: lang.id }));

        const { res, info } = await emit(`getLexemes`, { languageID: lang.id });

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBe(2);

        // check Lexemes
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBe(2);

        expect(res.every(lex => lex.type === `Lexeme`
          && lex.languageID === lang.id
          && typeof lex._attachments === `undefined`
          && typeof lex._rid === `undefined`
          && typeof lex._self === `undefined`
          && typeof lex.permissions === `undefined`
          && typeof lex.ttl === `undefined`
          && (lex.id === lex1.id || lex.id === lex2.id)
        ));

        expect(res.find(lex => lex.id === lex1.id)).toBeDefined();
        expect(res.find(lex => lex.id === lex2.id)).toBeDefined();

      }));

    });

    describe(`updateLexeme`, function() {

      it(`400: missing ID`, testAsync(async function() {

        const data = Object.assign({ tid: `missing ID` }, defaultData);
        const lex  = await upsert(coll, data);

        delete lex.id;

        try {
          const { res } = await emit(`updateLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ID`, testAsync(async function() {

        const data = Object.assign({ tid: `bad ID` }, defaultData);
        const lex  = await upsert(coll, data);
        delete lex.id;

        try {
          const { res } = await emit(`updateLexeme`, lex, { id: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ifMatch`, testAsync(async function() {

        const data = Object.assign({ tid: `bad ifMatch` }, defaultData);
        const lex  = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLexeme`, lex, { ifMatch: true });
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
        const lex      = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: bad permissions for Lexeme`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `bad permissions for Lexeme`,
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });

        const lex = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Lexeme not found`, testAsync(async function() {

        const data = Object.assign({ tid: `missing ID`, id: uuid() }, defaultData);

        try {
          const { res } = await emit(`updateLexeme`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(404);
        }

      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {

        const data = Object.assign({ tid: `ifMatch failed` }, defaultData);
        const lex  = await upsert(coll, data);

        // update data on server
        lex.changedProperty = true;
        await upsert(coll, lex);

        try {
          const { res } = await emit(`updateLexeme`, lex, { ifMatch: lex._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(412);
        }

      }));

      it(`422: Malformed data`, testAsync(async function() {

        const data = Object.assign({ tid: `422` }, defaultData);
        const lex  = await upsert(coll, data);

        // make data malformed
        lex.lemma = true;

        try {
          const { res } = await emit(`updateLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(422);
        }

      }));

      it(`200: Update`, testAsync(async function() {

        const data = Object.assign({ tid: `updateLexeme` }, defaultData);
        const lex  = await upsert(coll, data);

        lex.languageID      = uuid(); // languageID should not be updated
        lex.changedProperty = true;

        const { res, info } = await emit(`updateLexeme`, lex);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check server data
        const doc = await read(`${coll}/docs/${res.id}`);
        expect(doc.type).toBe(`Lexeme`);
        expect(doc.changedProperty).toBe(true);
        expect(doc.languageID).toBe(lang.id);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

      it(`200: Undelete`, testAsync(async function() {

        const data = Object.assign({ tid: `updateLexeme`, ttl: 300 }, defaultData);
        const lex  = await upsert(coll, data);

        lex.changedProperty = true;

        const { res, info } = await emit(`updateLexeme`, lex);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
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
        expect(doc.changedProperty).toBe(true);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

      it(`200: No languageID`, testAsync(async function() {

        const data = Object.assign({ tid: `no languageID` }, defaultData);
        const lex  = await upsert(coll, data);

        delete lex.languageID;
        lex.changedProperty = true;

        const { res, info } = await emit(`updateLexeme`, lex);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.changedProperty).toBe(true);
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
        expect(doc.changedProperty).toBe(true);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

      it(`ifMatch option`, testAsync(async function() {

        const data = Object.assign({ tid: `updateLexeme` }, defaultData);
        const lex  = await upsert(coll, data);

        lex.languageID      = uuid(); // languageID should not be updated
        lex.changedProperty = true;

        const { res, info } = await emit(`updateLexeme`, lex, { ifMatch: lex._etag });

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(lex.tid);
        expect(res.languageID).toBe(lang.id);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check server data
        const doc = await read(`${coll}/docs/${res.id}`);
        expect(doc.type).toBe(`Lexeme`);
        expect(doc.changedProperty).toBe(true);
        expect(doc.languageID).toBe(lang.id);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

    });

    describe(`upsertLexeme`, function() {

      // NOTE: Various tests for upsert resulting in a create operation are tested in addLexeme rather than here

      it(`400: bad options`, testAsync(async function() {

        const data = Object.assign({ tid: `bad options` }, defaultData);

        try {
          const { res } = await emit(`upsertLexeme`, data, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ifMatch`, testAsync(async function() {

        const data = Object.assign({ tid: `bad ifMatch` }, defaultData);
        const lex  = await upsert(coll, data);

        try {
          const { res } = await emit(`upsertLexeme`, lex, { ifMatch: true });
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
        const lex      = await upsert(coll, data);

        try {
          const { res } = await emit(`upsertLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: bad permissions for Lexeme`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `bad permissions for Lexeme`,
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });

        const lex = await upsert(coll, data);

        try {
          const { res } = await emit(`upsertLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {

        const data = Object.assign({ tid: `ifMatch failed` }, defaultData);
        const lex  = await upsert(coll, data);

        // change data on server
        lex.changedProperty = true;
        await upsert(coll, lex);

        // upsert Lexeme with outdated ifMatch option
        try {
          const { res } = await emit(`upsertLexeme`, lex, { ifMatch: lex._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(412);
        }

      }));

      it(`422: Malformed data`, testAsync(async function() {

        const data = Object.assign({ tid: `422` }, defaultData);
        const lex  = await upsert(coll, data);

        // make data malformed
        lex.lemma = true;

        try {
          const { res } = await emit(`upsertLexeme`, lex);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(422);
        }

      }));

      it(`201: Create`, testAsync(async function() {

        const data = Object.assign({ tid: `Create` }, defaultData);

        const { res, info } = await emit(`upsertLexeme`, data);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(data.tid);
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

      it(`201: Replace`, testAsync(async function() {

        const data = Object.assign({ tid: `Create` }, defaultData);
        const lex  = await upsert(coll, data);

        // change data
        lex.changedProperty = true;

        const { res, info } = await emit(`upsertLexeme`, lex);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(data.tid);
        expect(res.changedProperty).toBe(true);
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
        expect(doc.changedProperty).toBe(true);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

      it(`201: Undelete`, testAsync(async function() {

        const data = Object.assign({ tid: `Create`, ttl: 300 }, defaultData);
        const lex  = await upsert(coll, data);

        // change data
        lex.changedProperty = true;

        const { res, info } = await emit(`upsertLexeme`, lex);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Lexeme data
        expect(res.type).toBe(`Lexeme`);
        expect(res.tid).toBe(data.tid);
        expect(res.changedProperty).toBe(true);
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
        expect(doc.changedProperty).toBe(true);
        expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
        expect(doc.ttl).toBeUndefined();

      }));

    });

  });

};
