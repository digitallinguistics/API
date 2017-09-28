/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-magic-numbers,
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
  timeout,
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
          const { res } = await emit(`addLanguage`);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`422: Malformed Data`, testAsync(async function() {

        const data = Object.assign({}, defaultData, { name: true });

        try {
          const { res } = await emit(`addLanguage`, data);
          fail(res);
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
        expect(lang.id).toBe(data.id); // any provided ID should be deleted
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
          const { res } = await emit(`deleteLanguage`, lang.id, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ifMatch`, testAsync(async function() {

        const data = Object.assign({}, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`deleteLanguage`, lang.id, { ifMatch: true });
          fail(res);
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
          const { res } = await emit(`deleteLanguage`, lang.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`deleteLanguage`, lang.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Not Found`, testAsync(async function() {
        try {
          const { res } = await emit(`deleteLanguage`, `bad-id`);
          fail(res);
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
          const { res } = await emit(`deleteLanguage`, lang.id, { ifMatch: lang._etag });
          fail(res);
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

        // add test data
        const data = Object.assign({ tid: `304: Not Modified` }, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`getLanguage`, lang.id, { ifNoneMatch: lang._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(304);
        }

      }));

      it(`400: bad options`, testAsync(async function() {

        const data = Object.assign({ tid: `bad options` }, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`getLanguage`, lang.id, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad languageID`, testAsync(async function() {
        try {
          const { res } = await emit(`getLanguage`, ``);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad ifNoneMatch`, testAsync(async function() {

        const data = Object.assign({}, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`getLanguage`, lang.id, { ifNoneMatch: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`getLanguage`, lang.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Not Found`, testAsync(async function() {
        try {
          const { res } = await emit(`getLanguage`, `bad-id`);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(404);
        }
      }));

      it(`410: Gone`, testAsync(async function() {

        const data = Object.assign({ tid: `deletedLang`, ttl: 300 }, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`getLanguage`, lang.id);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(410);
        }

      }));

      it(`200: Success`, testAsync(async function() {

        // add test Language
        const data = Object.assign({ tid: `getLanguage` }, defaultData);
        const lang = await upsert(coll, data);

        // get Language
        const { res, info } = await emit(`getLanguage`, lang.id);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

      it(`200: Success (public Language)`, testAsync(async function() {

        // add public Language for another user
        const data = Object.assign({}, defaultData, {
          permissions: Object.assign({}, permissions, {
            owners: [`some-other-user`],
            public: true,
          }),
          tid: `public item`,
        });

        const lang = await upsert(coll, data);

        // get Language
        const { res, info } = await emit(`getLanguage`, lang.id);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

      it(`200: Success (deleted Language)`, testAsync(async function() {

        // add deleted Language
        let lang = Object.assign({ tid: `deleted Language`, ttl: 300 }, defaultData);
        lang     = await upsert(coll, lang);

        // get Language
        const { res, info } = await emit(`getLanguage`, lang.id, { deleted: true });

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(lang.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeDefined();

      }));

    });

    describe(`getLanguages`, function() {

      let deletedLang; // a Language that has already been deleted
      let privateLang; // private Language owned by another user
      let publicLang;  // public Language owned by another user
      let viewerLang;  // Language owned by another user, but testUser is Viewer
      let ownerLang;   // Language owned by testUser

      beforeAll(testAsync(async function() {

        deletedLang = Object.assign({ tid: `deletedLang`, ttl: 300 }, defaultData);

        privateLang = Object.assign({}, defaultData, {
          permissions: Object.assign({}, permissions, {
            owners: [`some-other-user`],
            public: false,
          }),
          tid: `privateData`,
        });

        publicLang = Object.assign({}, defaultData, {
          permissions: Object.assign({}, permissions, {
            owners: [`some-other-user`],
            public: true,
          }),
          tid: `publicData`,
        });

        viewerLang = Object.assign({}, defaultData, {
          permissions: Object.assign({}, permissions, {
            owners:  [`some-other-user`],
            viewers: [config.testUser],
            public:  false,
          }),
          tid: `viewerData`,
        });

        ownerLang = Object.assign({}, defaultData);

        deletedLang = await upsert(coll, deletedLang);
        privateLang = await upsert(coll, privateLang);
        publicLang  = await upsert(coll, publicLang);
        viewerLang  = await upsert(coll, viewerLang);
        ownerLang   = await upsert(coll, ownerLang);

      }));

      it(`bad options`, testAsync(async function() {
        try {
          const { res } = await emit(`getLanguages`, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad continuation`, testAsync(async function() {
        try {
          const { res } = await emit(`getLanguages`, { continuation: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad ifModifiedSince`, testAsync(async function() {
        try {
          const { res } = await emit(`getLanguages`, { ifModifiedSince: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`400: bad maxItemCount`, testAsync(async function() {
        try {
          const { res } = await emit(`getLanguages`, { maxItemCount: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }
      }));

      it(`200: Success`, testAsync(async function() {

        // get Languages
        const { res: langs, info } = await emit(`getLanguages`);

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBeGreaterThan(1);

        // check Language attributes
        expect(langs.every(lang => lang.type === `Language`
          && typeof lang._attachments === `undefined`
          && typeof lang._rid === `undefined`
          && typeof lang._self === `undefined`
          && typeof lang.permissions === `undefined`
          && typeof lang.ttl === `undefined`
        )).toBe(true);

        // check Languages
        expect(langs.find(lang => lang.id === privateLang.id)).toBeUndefined();
        expect(langs.find(lang => lang.id === publicLang.id)).toBeUndefined();
        expect(langs.find(lang => lang.id === viewerLang.id)).toBeDefined();
        expect(langs.find(lang => lang.id === ownerLang.id)).toBeDefined();

      }));

      it(`200: ifModifiedSince`, testAsync(async function() {

        // add test Languages with wait time between them
        const beforeData = Object.assign({ tid: `modifiedBefore` }, defaultData);
        const afterData  = Object.assign({ tid: `modifiedAfter` }, defaultData);

        const beforeLang = await upsert(coll, beforeData);
        await timeout(2000);
        const afterLang = await upsert(coll, afterData);

        // ifModifiedSince - add 1s to timestamp of modifiedBefore
        const ifModifiedSince = new Date((beforeLang._ts * 1000) + 1000);

        // get Languages with ifModifiedSince option
        const { res: langs, info } = await emit(`getLanguages`, { ifModifiedSince });

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBeGreaterThan(0);

        // check Language attributes
        expect(langs.every(lang => lang.type === `Language`
          && typeof lang._attachments === `undefined`
          && typeof lang._rid === `undefined`
          && typeof lang._self === `undefined`
          && typeof lang.permissions === `undefined`
          && typeof lang.ttl === `undefined`
        )).toBe(true);

        // only results modified after If-Modified-Since are returned
        expect(langs.some(lang => lang.id === beforeLang.id)).toBe(false);
        expect(langs.some(lang => lang.id === afterLang.id)).toBe(true);

      }));

      it(`200: maxItemCount / continuation`, testAsync(async function() {

        // get Languages with maxItemCount
        const { res: firstSet, info } = await emit(`getLanguages`, { maxItemCount: 2 });

        // check info
        const { continuation } = info;
        expect(info.status).toBe(200);
        expect(info.itemCount).toBe(2);
        expect(continuation).toBeDefined();

        // check Languages
        expect(Array.isArray(firstSet)).toBe(true);
        expect(firstSet.length).toBe(2);
        expect(firstSet.every(item => item.type === `Language`));

        // get Languages with continuation
        const { res: secondSet, info: moreInfo } = await emit(`getLanguages`, { continuation });

        // check info
        expect(moreInfo.status).toBe(200);
        expect(moreInfo.itemCount).toBeGreaterThan(0);

        // check Languages
        expect(Array.isArray(firstSet)).toBe(true);
        expect(secondSet.length).toBeGreaterThan(0);
        expect(secondSet.every(item => item.type === `Language`));

      }));

      it(`200: public option`, testAsync(async function() {

        // get public Languages
        const { res: langs, info } = await emit(`getLanguages`, { public: true });

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBeGreaterThan(0);

        // check Languages
        expect(langs.find(lang => lang.id === privateLang.id)).toBeUndefined();
        expect(langs.find(lang => lang.id === publicLang.id)).toBeDefined();
        expect(langs.find(lang => lang.id === viewerLang.id)).toBeDefined();
        expect(langs.find(lang => lang.id === ownerLang.id)).toBeDefined();

      }));

      it(`200: deleted option`, testAsync(async function() {

        // get public Languages
        const { res: langs, info } = await emit(`getLanguages`, { deleted: true });

        // check info
        expect(info.status).toBe(200);
        expect(info.itemCount).toBeGreaterThan(0);

        // check Languages
        expect(langs.find(lang => lang.id === privateLang.id)).toBeUndefined();
        expect(langs.find(lang => lang.id === publicLang.id)).toBeUndefined();
        expect(langs.find(lang => lang.id === viewerLang.id)).toBeDefined();
        expect(langs.find(lang => lang.id === ownerLang.id)).toBeDefined();
        expect(langs.find(lang => lang.id === deletedLang.id)).toBeDefined();

      }));

    });

    describe(`updateLanguage`, function() {

      it(`400: bad options`, testAsync(async function() {

        const data = Object.assign({ tid: `bad options` }, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLanguage`, lang, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ifMatch`, testAsync(async function() {

        const data = Object.assign({ tid: `bad options` }, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLanguage`, lang, { ifMatch: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`403: Unauthorized (bad scope)`, testAsync(async function() {

        const badToken = await getBadToken();
        const client   = await authenticate(v, badToken);
        const emit     = client.emitAsync;
        const data     = Object.assign({ tid: `bad scope` }, defaultData);
        const lang     = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLanguage`, lang);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `bad permissions`,
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`updateLanguage`, lang);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`404: Not Found`, testAsync(async function() {

        const data = { tid: `Not Found` };

        try {
          const { res } = await emit(`updateLanguage`, data, { id: `bad-id` });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(404);
        }

      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `If-Match not met` }, defaultData);
        const lang = await upsert(coll, data);

        // change data on server
        lang.changedProperty = true;
        await upsert(coll, lang);

        // update Language with outdated etag
        try {
          const { res } = await emit(`updateLanguage`, lang, { ifMatch: lang._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(412);
        }

      }));

      it(`422: Malformed data`, testAsync(async function() {

        // add test data
        const data = Object.assign({}, defaultData, { tid: `malformed` });
        const lang = await upsert(coll, data);

        // make data malformed
        lang.name = true;

        // update Language with malformed data
        try {
          const { res } = await emit(`updateLanguage`, lang);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(422);
        }

      }));

      it(`200: Updated`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `updateLanguage` }, defaultData);
        const lang = await upsert(coll, data);

        // change data for update
        const { id } = lang;
        lang.changedProperty = true;
        delete lang.id; // missing ID in body shouldn't throw an error

        // update data using id option
        const { res, info } = await emit(`updateLanguage`, lang, { id });

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res.changedProperty).toBe(true);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

      }));

      it(`200: Undeleted`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `undelete`, ttl: 300 }, defaultData);
        const lang = await upsert(coll, data);

        // change data for update
        lang.changedProperty = true;

        // update data using id
        const { res, info } = await emit(`updateLanguage`, lang);

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res.changedProperty).toBe(true);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check data on server
        const serverLang = await read(lang._self);
        expect(serverLang.ttl).toBeUndefined();

      }));

      it(`ifMatch`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `updateLanguage` }, defaultData);
        const lang = await upsert(coll, data);

        // change data for update
        lang.changedProperty = true;

        // update Language with ifMatch option
        const { res, info } = await emit(`updateLanguage`, lang, { ifMatch: lang._etag });

        // check info
        expect(info.status).toBe(200);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res.changedProperty).toBe(true);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check data on server
        const serverLang = await read(lang._self);
        expect(serverLang.ttl).toBeUndefined();

      }));

    });

    describe(`upsertLanguage`, function() {

      it(`400: bad options`, testAsync(async function() {

        const data = Object.assign({ tid: `bad options` }, defaultData);

        try {
          const { res } = await emit(`upsertLanguage`, data, true);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`400: bad ifMatch`, testAsync(async function() {

        const data = Object.assign({ tid: `bad ifMatch` }, defaultData);
        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`upsertLanguage`, lang, { ifMatch: true });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(400);
        }

      }));

      it(`403: Unauthorized (bad scope)`, testAsync(async function() {

        const badToken = await getBadToken();
        const client   = await authenticate(v, badToken);
        const emit     = client.emitAsync;
        const data     = Object.assign({ tid: `bad scope` }, defaultData);

        try {
          const { res } = await emit(`upsertLanguage`, data);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`403: Unauthorized (bad permissions)`, testAsync(async function() {

        const data = Object.assign({}, defaultData, {
          tid: `bad permissions`,
          permissions: Object.assign({}, permissions, { owners: [`some-other-user`] }),
        });

        const lang = await upsert(coll, data);

        try {
          const { res } = await emit(`upsertLanguage`, lang);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(403);
        }

      }));

      it(`412: ifMatch precondition failed`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `ifMatch` }, defaultData);
        const lang = await upsert(coll, data);

        // update data on server
        lang.changedProperty = true;
        await upsert(coll, lang);

        // upsert Language with outdated etag
        try {
          const { res } = await emit(`upsertLanguage`, lang, { ifMatch: lang._etag });
          fail(res);
        } catch (e) {
          expect(e.status).toBe(412);
        }

      }));

      it(`422: Malformed Data`, testAsync(async function() {

        // add test data
        const data = Object.assign({ tid: `malformed` }, defaultData);
        const lang = await upsert(coll, data);

        // make data malformed
        lang.name = true;

        // upsert malformed Language data
        try {
          const { res } = await emit(`upsertLanguage`, lang);
          fail(res);
        } catch (e) {
          expect(e.status).toBe(422);
        }

      }));

      it(`201: Create`, testAsync(async function() {

        // test data
        const data = Object.assign({ tid: `create` }, defaultData);

        // upsert new Language
        const { res, info } = await emit(`upsertLanguage`, data);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check data on server
        const serverLang = await read(`${coll}/docs/${res.id}`);
        expect(serverLang.type).toBe(`Language`);
        expect(serverLang.tid).toBe(data.tid);
        expect(serverLang.ttl).toBeUndefined();


      }));

      it(`201: Replace`, testAsync(async function() {

        // add test Language to server
        const data = Object.assign({ tid: `create` }, defaultData);
        const lang = await upsert(coll, data);

        // modify data
        lang.changedProperty = true;

        // upsert modified Language
        const { res, info } = await emit(`upsertLanguage`, lang);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.changedProperty).toBe(true);
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check data on server
        const serverLang = await read(`${coll}/docs/${res.id}`);
        expect(serverLang.changedProperty).toBe(true);
        expect(serverLang.type).toBe(`Language`);
        expect(serverLang.tid).toBe(data.tid);
        expect(serverLang.ttl).toBeUndefined();

      }));

      it(`201: Undelete`, testAsync(async function() {

        // add test Language to server
        const data = Object.assign({ tid: `create`, ttl: 300 }, defaultData);
        const lang = await upsert(coll, data);

        // modify data
        lang.changedProperty = true;

        // upsert modified Language
        const { res, info } = await emit(`upsertLanguage`, lang);

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.changedProperty).toBe(true);
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check data on server
        const serverLang = await read(`${coll}/docs/${res.id}`);
        expect(serverLang.changedProperty).toBe(true);
        expect(serverLang.type).toBe(`Language`);
        expect(serverLang.tid).toBe(data.tid);
        expect(serverLang.ttl).toBeUndefined();

      }));

      it(`ifMatch`, testAsync(async function() {

        // add test Language to server
        const data = Object.assign({ tid: `create`, ttl: 300 }, defaultData);
        const lang = await upsert(coll, data);

        // modify data
        lang.changedProperty = true;

        // upsert modified Language with ifMatch option
        const { res, info } = await emit(`upsertLanguage`, lang, { ifMatch: lang._etag });

        // check info
        expect(info.status).toBe(201);
        expect(Number.isInteger(Date.parse(info.lastModified))).toBe(true);

        // check Language attributes
        expect(res.changedProperty).toBe(true);
        expect(res.type).toBe(`Language`);
        expect(res.tid).toBe(data.tid);
        expect(res._attachments).toBeUndefined();
        expect(res._rid).toBeUndefined();
        expect(res._self).toBeUndefined();
        expect(res.permissions).toBeUndefined();
        expect(res.ttl).toBeUndefined();

        // check data on server
        const serverLang = await read(`${coll}/docs/${res.id}`);
        expect(serverLang.changedProperty).toBe(true);
        expect(serverLang.type).toBe(`Language`);
        expect(serverLang.tid).toBe(data.tid);
        expect(serverLang.ttl).toBeUndefined();

      }));

    });

  });

};
