/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  no-magic-numbers,
  no-shadow,
  no-underscore-dangle,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');
const uuid   = require('uuid/v4');

const test = true;

const {
  db,
  getBadToken,
  getToken,
  headers,
  testAsync,
  timeout,
} = require('../utilities');

const {
  coll,
  read,
  upsert,
} = db;

const {
  continuationHeader,
  ifMatchHeader,
  ifModifiedSinceHeader,
  ifNoneMatchHeader,
  itemCountHeader,
  lastModifiedHeader,
  maxItemCountHeader,
} = headers;

module.exports = (req, v = ``) => {

  describe(`Lexemes by Language`, function() {

    const languageID = uuid();
    let token;

    const permissions = {
      contributors: [],
      owners:       [config.testUser],
      public:       false,
      viewers:      [],
    };

    const defaultData = {
      languageID,
      lemma: {},
      permissions,
      senses: [],
      test,
      type: `Lexeme`,
    };

    const langData = {
      id: languageID,
      name: {},
      permissions,
      test,
      type: `Language`,
    };

    beforeAll(testAsync(async function() {
      const res = await getToken();
      token = `Bearer ${res}`;
      await upsert(coll, Object.assign({}, langData));
    }));

    describe(`/languages/:language/lexemes`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {
        await req.delete(`${v}/languages/${languageID}/lexemes`)
        .set(`Authorization`, token)
        .expect(405);
      }));

      describe(`GET`, function() {

        it(`400: bad dlx-max-item-count`, testAsync(async function() {
          await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(maxItemCountHeader, true)
          .expect(400);
        }));

        it(`400: bad dlx-continuation`, testAsync(async function() {
          await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(continuationHeader, true)
          .expect(400);
        }));

        it(`400: bad If-Modified-Since`, testAsync(async function() {
          await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(ifModifiedSinceHeader, true)
          .expect(400);
        }));

        it(`200: Success`, testAsync(async function() {

          // add test data
          const lex3Data = Object.assign({}, defaultData, {
            permissions: { owners: [`some-other-user`] },
            tid: `getLexemes3`,
          });

          const lex1 = await upsert(coll, Object.assign({ tid: `getLexemes1` }, defaultData));
          const lex2 = await upsert(coll, Object.assign({ tid: `getLexemes2` }, defaultData));
          const lex3 = await upsert(coll, lex3Data);

          // get Lexemes
          const { body: lexemes } = await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send({}) // including body should not throw an error
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // check Language attributes
          expect(lexemes.every(lex => lex.type === `Lexeme`
            && typeof lex._attachments === `undefined`
            && typeof lex._rid === `undefined`
            && typeof lex._self === `undefined`
            && typeof lex.permissions === `undefined`
            && typeof lex.ttl === `undefined`
          )).toBe(true);

          // check that test data is included in the results
          expect(lexemes.length).toBeGreaterThan(1);
          expect(lexemes.find(lex => lex.id === lex1.id && lex.tid === lex1.tid)).toBeDefined();
          expect(lexemes.find(lex => lex.id === lex2.id && lex.tid === lex2.tid)).toBeDefined();

          // only items that the user has permission to view should be included in the results
          expect(lexemes.find(lex => lex.id === lex3.id && lex.tid === lex3.tid)).toBeUndefined();

          // only items for this Language are included
          expect(lexemes.every(lex => lex.languageID === langData.id)).toBe(true);

        }));

        it(`200: user has permissions for Lexemes but not Language`, testAsync(async function() {

          // upsert Language with another user as Owner
          const language = Object.assign({}, langData, {
            id: uuid(),
            permissions: { owners: [`some-other-user`] },
          });

          const lang = await upsert(coll, language);

          // upsert Lexeme with testUser as Viewer
          const data = Object.assign({}, defaultData, {
            languageID: lang.id,
            permissions: {
              owners:  [`some-other-user`],
              viewers: [config.testUser],
            },
          });

          const lex = await upsert(coll, data);

          // get Lexemes with testUser permissions
          const { body: lexemes } = await req.get(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // test Lexeme should be included in results
          expect(lexemes.find(lexeme => lexeme.id === lex.id)).toBeDefined();

        }));

        it(`dlx-max-item-count / dlx-continuation`, testAsync(async function() {

          // add test data
          await upsert(coll, Object.assign({ tid: `getLexemes-continuation1` }, defaultData));
          await upsert(coll, Object.assign({ tid: `getLexemes-continuation2` }, defaultData));
          await upsert(coll, Object.assign({ tid: `getLexemes-continuation3` }, defaultData));

          // dlx-max-item-count
          const res = await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(maxItemCountHeader, 2)
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/)
          .expect(continuationHeader, /.+/);

          // check Language attributes
          expect(res.body.every(lex => lex.type === `Lexeme`
            && typeof lex._attachments === `undefined`
            && typeof lex._rid === `undefined`
            && typeof lex._self === `undefined`
            && typeof lex.permissions === `undefined`
            && typeof lex.ttl === `undefined`
          )).toBe(true);

          // only the requested # of results are returned
          expect(res.body.length).toBe(2);

          // dlx-continuation
          const { body: lexemes } = await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(continuationHeader, res.headers[continuationHeader])
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          expect(lexemes.length).toBeGreaterThan(0);

          // check Language attributes
          expect(lexemes.every(lex => lex.type === `Lexeme`
            && typeof lex._attachments === `undefined`
            && typeof lex._rid === `undefined`
            && typeof lex._self === `undefined`
            && typeof lex.permissions === `undefined`
            && typeof lex.ttl === `undefined`
          )).toBe(true);

        }));

        it(`If-Modified-Since`, testAsync(async function() {

          // add test data
          const modifiedBefore = Object.assign({ tid: `modifiedBefore` }, defaultData);
          const modifiedAfter  = Object.assign({ tid: `modifiedAfter` }, defaultData);

          const lex1 = await upsert(coll, modifiedBefore);
          await timeout(2000);
          const lex2 = await upsert(coll, modifiedAfter);

          // If-Modified-Since
          const ifModifiedSince = new Date((lex1._ts * 1000) + 1000); // add 1s to timestamp of modifiedBefore

          const { body: lexemes } = await req.get(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(ifModifiedSinceHeader, ifModifiedSince)
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // check Lexeme attributes
          expect(lexemes.every(lex => lex.type === `Lexeme`
            && typeof lex._attachments === `undefined`
            && typeof lex._rid === `undefined`
            && typeof lex._self === `undefined`
            && typeof lex.permissions === `undefined`
            && typeof lex.ttl === `undefined`
          )).toBe(true);

          // only results modified after If-Modified-Since are returned
          expect(lexemes.some(lex => lex.id === lex1.id)).toBe(false);
          expect(lexemes.some(lex => lex.id === lex2.id)).toBe(true);

        }));

        it(`public`, testAsync(async function() {

          // add test data
          const language = Object.assign({}, langData, {
            id: uuid(),
            permissions: { owners: [`some-other-user`] },
          });

          const lang = await upsert(coll, language);

          const privateData = Object.assign({}, defaultData, {
            languageID: lang.id,
            permissions: {
              owners: [`some-other-user`],
              public: false,
            },
            tid: `privateData`,
          });

          const publicData  = Object.assign({}, defaultData, {
            languageID: lang.id,
            permissions: {
              owners: [`some-other-user`],
              public: true,
            },
            tid: `publicData`,
          });

          const privateLex = await upsert(coll, privateData);
          const publicLex  = await upsert(coll, publicData);

          // bad public value does not return public results
          const { body: badLexemes } = await req.get(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .query({ public: `yes` })
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          expect(badLexemes.find(lang => lang.id === publicLex.id)).toBeUndefined();
          expect(badLexemes.find(lang => lang.id === privateLex.id)).toBeUndefined();

          // request public items
          const { body: lexemes } = await req.get(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .query({ public: true })
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // check Language attributes
          expect(lexemes.every(lex => lex.type === `Lexeme`
            && typeof lex._attachments === `undefined`
            && typeof lex._rid === `undefined`
            && typeof lex._self === `undefined`
            && typeof lex.permissions === `undefined`
            && typeof lex.ttl === `undefined`
          )).toBe(true);

          // public items are included in response
          expect(lexemes.find(lang => lang.id === publicLex.id)).toBeDefined();
          // private items are not included in response
          expect(lexemes.find(lang => lang.id === privateLex.id)).toBeUndefined();

        }));

      });

      describe(`POST`, function() {

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();

          await req.post(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`403: no permissions for Language`, testAsync(async function() {

          const data = Object.assign({}, langData, {
            id: uuid(),
            permissions: { owners: [`some-other-user`] },
          });

          const lang    = await upsert(coll, data);
          const lexData = Object.assign({}, defaultData, { languageID: lang.id });

          await req.post(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .send(lexData)
          .expect(403);

        }));

        it(`422: Malformed data`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { lemma: true });

          await req.post(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(422);

        }));

        it(`201: Created`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { id: uuid(), tid: `addLexeme` });

          const { body: lex, headers } = await req.post(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.id).not.toBe(data.id);
          expect(lex.tid).toBe(data.tid);
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lex.id}`);
          expect(doc.type).toBe(`Lexeme`);
          expect(doc.languageID).toBe(langData.id);
          expect(doc.tid).toBe(data.tid);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);
          expect(doc.ttl).toBeUndefined();

        }));

        it(`201: Created as Contributor to Language`, testAsync(async function() {

          // add test Language with some-other-user as Owner and testUser as Contributor
          const language = Object.assign({}, langData, {
            id: uuid(),
            permissions: {
              contributors: [config.testUser],
              owners:       [`some-other-user`],
            },
          });

          const lang = await upsert(coll, language);

          // create a Lexeme with testUser permissions
          const data = Object.assign({}, defaultData, { languageID: lang.id });

          const { body: lex } = await req.post(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // check server data
          const serverData = await read(`${coll}/docs/${lex.id}`);
          expect(serverData.permissions.owners.includes(`some-other-user`));
          expect(serverData.permissions.owners.includes(config.testUser));

        }));

      });

      describe(`PUT`, function() {

        it(`400: bad If-Match header`, testAsync(async function() {

          const data = Object.assign({ tid: `bad if-match` }, defaultData);
          const lex  = await upsert(coll, data);

          await req.put(`${v}/lexemes`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, ``) // cannot use true to test this because it results in a valid String, and a 412 response
          .send(lex)
          .expect(400);

        }));

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();

          await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`403: bad permissions for Lexeme`, testAsync(async function() {

          const permissions = { owners: [`some-other-user`] };

          const language = Object.assign({}, langData, { id: uuid(), permissions });
          const lang     = await upsert(coll, language);
          const data     = Object.assign({}, defaultData, { languageID: lang.id, permissions });
          const lex      = await upsert(coll, data);

          await req.put(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .send(lex)
          .expect(403);

        }));

        it(`404: bad languageID`, testAsync(async function() {

          const data = Object.assign({}, defaultData);

          await req.put(`${v}/languages/bad-id/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(404);

        }));

        it(`404: Not Found`, testAsync(async function() {

          const languageID = uuid();
          const data       = Object.assign({}, defaultData, { languageID, tid: `Not Found` });

          await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(404);

        }));

        it(`412: If-Match precondition not met`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `ifMatch` }, defaultData);
          const lex  = await upsert(coll, data);

          // update data on server
          lex.changedProperty = true;
          await upsert(coll, lex);

          // returns 412 if data has been updated
          await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lex._etag)
          .send(lex)
          .expect(412);

        }));

        it(`422: Malformed data`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { lemma: true });

          await req.post(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(422);

        }));

        it(`201: Create`, testAsync(async function() {

          const data = Object.assign({ tid: `upsertLexeme - add` }, defaultData);

          const { body: lex, headers } = await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, `some etag`) // If-Match header should be ignored when creating a new Lexeme
          .send(data)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.tid).toBe(data.tid);
          expect(lex.languageID).toBe(langData.id);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lex.id}`);
          expect(doc.tid).toBe(data.tid);
          expect(doc.type).toBe(`Lexeme`);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);

        }));

        it(`201: Replace`, testAsync(async function() {

          // add test data
          const data    = Object.assign({ tid: `upsertLexeme - replace` }, defaultData);
          const lexData = await upsert(coll, data);

          // change data
          lexData.newProperty = true;
          lexData.tid         = `upsertLanguageAgain`;

          // upsert changed data
          const { body: lex, headers } = await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send(lexData)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex.tid).toBe(lexData.tid);
          expect(lex.newProperty).toBe(true);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lex.id}`);
          expect(doc.tid).toBe(lexData.tid);
          expect(doc.newProperty).toBe(true);
          expect(doc.type).toBe(`Lexeme`);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);

        }));

        it(`201: Undelete`, testAsync(async function() {

          const data       = Object.assign({ tid: `upsertDeleted`, ttl: 300 }, defaultData);
          const deletedLex = await upsert(coll, data);
          delete deletedLex.ttl;

          // upserting a deleted Lexeme undeletes it
          const { body: lex, headers } = await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .send(deletedLex)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.tid).toBe(data.tid);
          expect(lex.languageID).toBe(langData.id);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(deletedLex._self);
          expect(serverData.ttl).toBeUndefined();

        }));

        it(`201: Upsert with Contributor permissions for Language`, testAsync(async function() {

          // NB: This is testing replace, not create (that's tested in POST /languages/${languageID}/lexemes)

          // upsert Language with another user as Owner
          const language = Object.assign({}, langData, {
            id: uuid(),
            permissions: {
              contributors: [config.testUser],
              owners: [`some-other-user`],
            },
          });

          const lang = await upsert(coll, language);

          // upsert Lexeme with testUser as Contributor
          const data = Object.assign({}, defaultData, {
            languageID: lang.id,
            permissions: {
              contributors: [config.testUser],
              owners:       [`some-other-user`],
            },
          });

          const lexeme = await upsert(coll, data);
          lexeme.changedProperty = true;

          // upsert using testUser permissions
          const { body: lex } = await req.put(`${v}/languages/${lang.id}/lexemes`)
          .set(`Authorization`, token)
          .send(lexeme)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          expect(lex.changedProperty).toBe(true);

        }));

        it(`If-Match`, testAsync(async function() {

          const data = Object.assign({ tid: `ifMatch` }, defaultData);
          const res  = await upsert(coll, data);

          // returns 201 if data has not been updated
          const { body: lex } = await req.put(`${v}/languages/${languageID}/lexemes`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, res._etag)
          .send(res)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.tid).toBe(data.tid);
          expect(lex.languageID).toBe(langData.id);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

        }));

      });

    });

    describe(`/languages/${languageID}/lexemes/{lexeme}`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {

        const lex = await upsert(coll, defaultData);

        await req.post(`${v}/languages/${languageID}/lexemes/${lex.id}`)
        .set(`Authorization`, token)
        .expect(405);

      }));

      describe(`DELETE`, function() {

        it(`400: bad If-Match`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `bad If-Match` }, defaultData);
          const lex  = await upsert(coll, data);

          // delete Lexeme with If-Match
          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, ``)
          .expect(400);

        }));

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();
          const data     = Object.assign({ tid: `bad scope` }, defaultData);
          const lex      = await upsert(coll, data);

          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`403: Forbidden (bad permissions on Lexeme)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lex  = await upsert(coll, data);

          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {
          await req.delete(`${v}/languages/${languageID}/lexemes/bad-id`)
          .set(`Authorization`, token)
          .expect(404);
        }));

        it(`412: If-Match precondition not met`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `ifMatch` }, defaultData);
          const lex  = await upsert(coll, data);

          // update data on server
          lex.changedProperty = true;
          await upsert(coll, lex);

          // returns 412 if data has been updated
          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .expect(412)
          .set(ifMatchHeader, lex._etag);

        }));

        it(`204: Delete Successful`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `deleteLexeme` }, defaultData);
          const lex  = await upsert(coll, data);

          // delete Lexeme
          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .expect(204);

          // check that Lexeme is deleted on server
          const serverLex = await read(lex._self);
          expect(serverLex.ttl).toBeDefined();

        }));

        it(`204: already deleted`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `deleteLexeme`, ttl: 300 }, defaultData);
          const lex  = await upsert(coll, data);

          // delete Language
          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .expect(204);

          // check data on server
          const res = await read(lex._self);
          expect(res.ttl).toBeDefined();

        }));

        it(`If-Match`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `deleteLexeme - If-Match` }, defaultData);
          const lex  = await upsert(coll, data);

          // delete Lexeme with If-Match
          await req.delete(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lex._etag)
          .expect(204);

          // check data on server
          const res = await read(lex._self);
          expect(res.ttl).toBeDefined();

        }));

      });

      describe(`GET`, function() {

        it(`304: Not Modified`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `304: Not Modified` }, defaultData);
          const lex = await upsert(coll, data);

          // If-None-Match
          await req.get(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .set(ifNoneMatchHeader, lex._etag)
          .expect(304);

        }));

        it(`400: bad If-None-Match`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `304: Not Modified` }, defaultData);
          const lex = await upsert(coll, data);

          // If-None-Match
          await req.get(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .set(ifNoneMatchHeader, ``)
          .expect(400);

        }));

        it(`403: Forbidden (bad permissions)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lex  = await upsert(coll, data);

          await req.get(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {
          await req.get(`${v}/languages/${languageID}/lexemes/bad-id`)
          .set(`Authorization`, token)
          .expect(404);
        }));

        it(`410: gone`, testAsync(async function() {

          const data = Object.assign({ tid: `deletedLang`, ttl: 300 }, defaultData);
          const lex  = await upsert(coll, data);

          await req.get(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .expect(410);

        }));

        it(`200: Success`, testAsync(async function() {

          const data   = Object.assign({ tid: `getLexeme` }, defaultData);
          const lexeme = await upsert(coll, data);

          const { body: lex, headers } = await req.get(`${v}/languages/${languageID}/lexemes/${lexeme.id}`)
          .set(`Authorization`, token)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex.tid).toBe(data.tid);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

        }));

        it(`200: retrieves public items`, testAsync(async function() {

          const data = Object.assign({}, defaultData, {
            permissions: {
              owners: [`some-other-user`],
              public: true,
            },
            tid: `public item`,
          });

          const lexeme = await upsert(coll, data);

          const { body: lex, headers } = await req.get(`${v}/languages/${languageID}/lexemes/${lexeme.id}`)
          .set(`Authorization`, token)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex.tid).toBe(data.tid);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

        }));

      });

      describe(`PATCH`, function() {

        it(`400: bad If-Match`, testAsync(async function() {

          const data = Object.assign({ tid: `bad If-Match` }, defaultData);
          const lex  = await upsert(coll, data);

          await req.patch(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, ``)
          .send(lex)
          .expect(400);

        }));

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();
          const data     = Object.assign({ tid: `bad scope` }, defaultData);
          const lex      = await upsert(coll, data);

          await req.patch(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .send(lex)
          .expect(403);

        }));

        it(`403: Forbidden (bad permissions)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lex  = await upsert(coll, data);

          await req.patch(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .send(lex)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {
          await req.patch(`${v}/languages/${languageID}/lexemes/bad-id`)
          .set(`Authorization`, token)
          .expect(404);
        }));

        it(`412: If-Match precondition not met`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `If-Match not met` }, defaultData);
          const lex  = await upsert(coll, data);

          // change data on server
          lex.changedProperty = true;
          await upsert(coll, lex);

          // If-Match
          await req.patch(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lex._etag)
          .send(lex)
          .expect(412);

        }));

        it(`422: Malformed Data`, testAsync(async function() {

          // add test data
          const data = Object.assign({}, defaultData, { tid: `malformed` });
          const lex  = await upsert(coll, data);

          // make data malformed
          lex.lemma = true;

          // attempt to update data
          await req.patch(`${v}/languages/${languageID}/lexemes/${lex.id}`)
          .set(`Authorization`, token)
          .send(lex)
          .expect(422);

        }));

        it(`200: updated`, testAsync(async function() {

          // add test data
          const data   = Object.assign({ tid: `updateLexeme` }, defaultData);
          const lexeme = await upsert(coll, data);

          // change data for update
          const { id } = lexeme;
          lexeme.changedProperty = true;
          lexeme.languageID      = uuid(); // change in languageID should be ignored
          delete lexeme.id;                // missing ID in body shouldn't throw an error

          // update Lexeme
          const { body: lex, headers } = await req.patch(`${v}/languages/${languageID}/lexemes/${id}`)
          .set(`Authorization`, token)
          .send(lexeme)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex.changedProperty).toBe(true);
          expect(lex.tid).toBe(data.tid);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(lexeme._self);

          expect(serverData.type).toBe(`Lexeme`);
          expect(serverData.tid).toBe(data.tid);
          expect(serverData.languageID).toBe(langData.id);
          expect(serverData.changedProperty).toBe(true);
          expect(serverData.ttl).toBeUndefined();

        }));

        it(`200: Undelete`, testAsync(async function() {

          const data   = Object.assign({ tid: `undeleteLexeme`, ttl: 300 }, defaultData);
          const lexeme = await upsert(coll, data);

          lexeme.changedProperty = true;

          // update Lexeme
          const { body: lex, headers } = await req.patch(`${v}/languages/${languageID}/lexemes/${lexeme.id}`)
          .set(`Authorization`, token)
          .send(lexeme)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex.changedProperty).toBe(true);
          expect(lex.tid).toBe(data.tid);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(lexeme._self);

          expect(serverData.type).toBe(`Lexeme`);
          expect(serverData.languageID).toBe(langData.id);
          expect(serverData.tid).toBe(data.tid);
          expect(serverData.changedProperty).toBe(true);
          expect(serverData.ttl).toBeUndefined();

        }));

        it(`If-Match`, testAsync(async function() {

          // add test data
          const data   = Object.assign({ tid: `updateLexeme` }, defaultData);
          const lexeme = await upsert(coll, data);

          // change data for update
          lexeme.changedProperty = true;

          // update Lexeme with If-Match header
          const { body: lex, headers } = await req.patch(`${v}/languages/${languageID}/lexemes/${lexeme.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lexeme._etag)
          .send(lexeme)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex.changedProperty).toBe(true);
          expect(lex.tid).toBe(data.tid);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(lexeme._self);

          expect(serverData.type).toBe(`Lexeme`);
          expect(serverData.tid).toBe(data.tid);
          expect(serverData.languageID).toBe(langData.id);
          expect(serverData.changedProperty).toBe(true);
          expect(serverData.ttl).toBeUndefined();

        }));

      });

    });

  });

};
