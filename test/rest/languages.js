/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-invalid-this,
  no-magic-numbers,
  no-shadow,
  no-underscore-dangle,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');
const uuid   = require('uuid/v4');

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
  maxItemsHeader,
} = headers;

const permissions = {
  contributors: [],
  owners:  [config.testUser],
  public:  false,
  viewers: [],
};

const test = true;
const type = `Language`;

const defaultData = {
  name: {},
  permissions,
  test,
  type,
};

module.exports = (req, v = ``) => {

  describe(`Languages`, function() {

    let token;

    beforeAll(testAsync(async function() {
      const res = await getToken();
      token = `Bearer ${res}`;
    }));

    describe(`/languages`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {
        await req.delete(`${v}/languages`)
        .set(`Authorization`, token)
        .expect(405);
      }));

      describe(`GET`, function() {

        it(`400: bad dlx-max-item-count header`, testAsync(async function() {
          await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .expect(400)
          .set(maxItemsHeader, true);
        }));

        it(`400: bad dlx-continuation header`, testAsync(async function() {
          await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .expect(400)
          .set(continuationHeader, true);
        }));

        it(`400: bad If-Modified-Since header`, testAsync(async function() {
          await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .expect(400)
          .set(ifModifiedSinceHeader, true);
        }));

        it(`200: Success`, testAsync(async function() {

          // add test data
          const lang3Data = Object.assign({}, defaultData, {
            permissions: { owners: [`some-other-user`] },
            tid: `getLanguages2`,
          });

          const lang1 = await upsert(coll, Object.assign({ tid: `getLanguages1` }, defaultData));
          const lang2 = await upsert(coll, Object.assign({ tid: `getLanguages2` }, defaultData));
          const lang3 = await upsert(coll, lang3Data);

          // get Languages
          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .send({}) // including body should not throw an error
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // check Language attributes
          expect(langs.every(lang => lang.type === `Language`
            && typeof lang._attachments === `undefined`
            && typeof lang._rid === `undefined`
            && typeof lang._self === `undefined`
            && typeof lang.permissions === `undefined`
            && typeof lang.ttl === `undefined`
          )).toBe(true);

          // check that test data is included in the results
          expect(langs.length).toBeGreaterThan(1);
          expect(langs.some(lang => lang.id === lang1.id && lang.tid === lang1.tid)).toBe(true);
          expect(langs.some(lang => lang.id === lang2.id && lang.tid === lang2.tid)).toBe(true);

          // only items that the user has permission to view should be included in the results
          expect(langs.some(lang => lang.id === lang3.id && lang.tid === lang3.tid)).toBe(false);

        }));

        it(`dlx-max-item-count / continuation`, testAsync(async function() {

          // add test data
          await upsert(coll, Object.assign({ tid: `getLanguages-continuation1` }, defaultData));
          await upsert(coll, Object.assign({ tid: `getLanguages-continuation2` }, defaultData));
          await upsert(coll, Object.assign({ tid: `getLanguages-continuation3` }, defaultData));

          // dlx-max-item-count
          const res = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(maxItemsHeader, 2)
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/)
          .expect(continuationHeader, /.+/);

          // check Language attributes
          expect(res.body.every(lang => lang.type === `Language`
            && typeof lang._attachments === `undefined`
            && typeof lang._rid === `undefined`
            && typeof lang._self === `undefined`
            && typeof lang.permissions === `undefined`
            && typeof lang.ttl === `undefined`
          )).toBe(true);

          // only the requested # of results are returned
          expect(res.body.length).toBe(2);

          // dlx-continuation
          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(continuationHeader, res.headers[continuationHeader])
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          expect(langs.length).toBeGreaterThan(0);

          // check Language attributes
          expect(langs.every(lang => lang.type === `Language`
            && typeof lang._attachments === `undefined`
            && typeof lang._rid === `undefined`
            && typeof lang._self === `undefined`
            && typeof lang.permissions === `undefined`
            && typeof lang.ttl === `undefined`
          )).toBe(true);

        }));

        it(`If-Modified-Since`, testAsync(async function() {

          // add test data
          const modifiedBefore = Object.assign({ tid: `modifiedBefore` }, defaultData);
          const modifiedAfter  = Object.assign({ tid: `modifiedAfter` }, defaultData);

          const lang1 = await upsert(coll, modifiedBefore);
          await timeout(2000);
          const lang2 = await upsert(coll, modifiedAfter);

          // If-Modified-Since
          const ifModifiedSince = new Date((lang1._ts * 1000) + 1000); // add 1s to timestamp of modifiedBefore

          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifModifiedSinceHeader, ifModifiedSince)
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // check Language attributes
          expect(langs.every(lang => lang.type === `Language`
            && typeof lang._attachments === `undefined`
            && typeof lang._rid === `undefined`
            && typeof lang._self === `undefined`
            && typeof lang.permissions === `undefined`
            && typeof lang.ttl === `undefined`
          )).toBe(true);

          // only results modified after If-Modified-Since are returned
          expect(langs.some(lang => lang.id === lang1.id)).toBe(false);
          expect(langs.some(lang => lang.id === lang2.id)).toBe(true);

        }));

        it(`public`, testAsync(async function() {

          // add test data
          const privateData = Object.assign({}, defaultData, {
            permissions: {
              owners: [`some-other-user`],
              public: false,
            },
            tid: `privateData`,
          });

          const publicData  = Object.assign({}, defaultData, {
            permissions: {
              owners: [`some-other-user`],
              public: true,
            },
            tid: `publicData`,
          });

          const privateLang = await upsert(coll, privateData);
          const publicLang  = await upsert(coll, publicData);

          // bad public value does not return public results
          const { body: badLangs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .query({ public: `yes` })
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          expect(badLangs.find(lang => lang.id === publicLang.id)).toBeUndefined();
          expect(badLangs.find(lang => lang.id === privateLang.id)).toBeUndefined();

          // request public items
          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .query({ public: true })
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // check Language attributes
          expect(langs.every(lang => lang.type === `Language`
            && typeof lang._attachments === `undefined`
            && typeof lang._rid === `undefined`
            && typeof lang._self === `undefined`
            && typeof lang.permissions === `undefined`
            && typeof lang.ttl === `undefined`
          )).toBe(true);

          // public items are included in response
          expect(langs.find(lang => lang.id === publicLang.id)).toBeDefined();
          // private items are not included in response
          expect(langs.find(lang => lang.id === privateLang.id)).toBeUndefined();

        }));

      });

      describe(`POST`, function() {

        it(`403: Forbidden (bad scope)`, testAsync(async function() {

          const badToken = await getBadToken();

          await req.post(`${v}/languages`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`422: Malformed Data`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { name: true });

          await req.post(`${v}/languages`)
          .set(`Authorization`, token)
          .send(data)
          .expect(422);

        }));

        it(`201: missing body creates new Language`, testAsync(async function() {

          const { body: lang, headers } = await req.post(`${v}/languages`)
          .set(`Authorization`, token)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // NOTE: don't bother checking data on server - this is done in the next test

        }));

        it(`201: adds a Language`, testAsync(async function() {

          const data = Object.assign({ id: uuid(), tid: `addLanguage` }, defaultData);

          const { body: lang, headers } = await req.post(`${v}/languages`)
          .set(`Authorization`, token)
          .send(data)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.id).not.toBe(data.id); // any provided ID should be deleted
          expect(lang.type).toBe(`Language`);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lang.id}`);
          expect(doc.type).toBe(`Language`);
          expect(doc.tid).toBe(data.tid);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);

        }));

      });

      describe(`PUT`, function() {

        it(`400: bad If-Match header`, testAsync(async function() {

          const data = Object.assign({ tid: `bad if-match` }, defaultData);
          const lang = await upsert(coll, data);

          await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, ``) // cannot use true to test this because it results in a valid String, and a 412 response
          .send(lang)
          .expect(400);

        }));

        it(`403: Forbidden (bad scope)`, testAsync(async function() {

          const badToken = await getBadToken();

          await req.put(`${v}/languages`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`403: Forbidden (bad permissions)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lang = await upsert(coll, data);

          await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .send(lang)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {

          const data = Object.assign({ id: uuid() }, defaultData);

          await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .send(data)
          .expect(404);

        }));

        it(`412: If-Match precondition not met`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `ifMatch` }, defaultData);
          const lang = await upsert(coll, data);

          // update data on server
          lang.changedProperty = true;
          await upsert(coll, lang);

          // returns 412 if data has been updated
          await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lang._etag)
          .send(lang)
          .expect(412);

        }));

        it(`422: Malformed Data`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { name: true });

          await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .send(data)
          .expect(422);

        }));

        it(`201: No body`, testAsync(async function() {

          const { body: lang, headers } = await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lang.id}`);
          expect(doc.type).toBe(`Language`);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);

        }));

        it(`201: Create`, testAsync(async function() {

          const data = Object.assign({ tid: `upsertLanguage - add` }, defaultData);

          const { body: lang, headers } = await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, `some etag`) // If-Match header should be ignored when creating a new Language
          .send(data)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lang.id}`);
          expect(doc.tid).toBe(data.tid);
          expect(doc.type).toBe(`Language`);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);

        }));

        it(`201: Replace`, testAsync(async function() {

          // add test data
          const data     = Object.assign({ tid: `upsertLanguage - replace` }, defaultData);
          const langData = await upsert(coll, data);

          // change data
          langData.newProperty = true;
          langData.tid         = `upsertLanguageAgain`;

          // upsert changed data
          const { body: lang, headers } = await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .send(langData)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(langData.tid);
          expect(lang.newProperty).toBe(true);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const doc = await read(`${coll}/docs/${lang.id}`);
          expect(doc.tid).toBe(langData.tid);
          expect(doc.newProperty).toBe(true);
          expect(doc.type).toBe(`Language`);
          expect(doc.permissions.owners.includes(config.testUser)).toBe(true);

        }));

        it(`201: Undelete`, testAsync(async function() {

          const data        = Object.assign({ tid: `upsertDeleted`, ttl: 300 }, defaultData);
          const deletedLang = await upsert(coll, data);
          delete deletedLang.ttl;

          // upserting a deleted language undeletes it
          const { body: lang, headers } = await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .send(deletedLang)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(deletedLang._self);
          expect(serverData.ttl).toBeUndefined();

        }));

        it(`If-Match`, testAsync(async function() {

          const data = Object.assign({ tid: `ifMatch` }, defaultData);
          const res  = await upsert(coll, data);

          // returns 201 if data has not been updated
          const { body: lang } = await req.put(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, res._etag)
          .send(res)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

        }));

      });

    });

    describe(`/languages/{language}`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {

        const data = Object.assign({ tid: 405 }, defaultData);
        const lang = await upsert(coll, data);

        await req.post(`${v}/languages/${lang.id}`)
        .set(`Authorization`, token)
        .expect(405);

      }));

      describe(`DELETE`, function() {

        it(`400: bad If-Match`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `bad If-Match` }, defaultData);
          const lang = await upsert(coll, data);

          // delete Language with bad If-Match
          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, ``)
          .expect(400);

        }));

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();
          const data     = Object.assign({ tid: `bad scope` }, defaultData);
          const lang     = await upsert(coll, data);

          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`403: Forbidden (bad permissions)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lang = await upsert(coll, data);

          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {
          await req.delete(`${v}/languages/bad-id`)
          .set(`Authorization`, token)
          .expect(404);
        }));

        it(`412: If-Match precondition not met`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `ifMatch` }, defaultData);
          const lang = await upsert(coll, data);

          // update data on server
          lang.changedProperty = true;
          await upsert(coll, lang);

          // returns 412 if data has been updated
          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .expect(412)
          .set(ifMatchHeader, lang._etag);

        }));

        it(`204: Delete Successful`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `deleteLanguage` }, defaultData);
          const lang = await upsert(coll, data);

          const lexData = {
            languageID: lang.id,
            lemma: {},
            permissions,
            senses: [],
            test,
            type: `Lexeme`,
          };

          const lex = await upsert(coll, lexData);

          // delete Language
          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .expect(204);

          // check data on server
          const serverLang = await read(lang._self);
          expect(serverLang.ttl).toBeDefined();

          // check that Lexeme is also deleted
          const serverLex = await read(lex._self);
          expect(serverLex.ttl).toBeDefined();

        }));

        it(`204: already deleted`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `deleteLanguage`, ttl: 300 }, defaultData);
          const lang = await upsert(coll, data);

          // delete Language
          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .expect(204);

          // check data on server
          const res = await read(lang._self);
          expect(res.ttl).toBeDefined();

        }));

        it(`If-Match`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `deleteLanguage - If-Match` }, defaultData);
          const lang = await upsert(coll, data);

          // delete Language with If-Match
          await req.delete(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lang._etag)
          .expect(204);

          // check data on server
          const res = await read(lang._self);
          expect(res.ttl).toBeDefined();

        }));

      });

      describe(`GET`, function() {

        it(`304: Not Modified`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `304: Not Modified` }, defaultData);
          const lang = await upsert(coll, data);

          // If-None-Match
          await req.get(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .set(ifNoneMatchHeader, lang._etag)
          .expect(304);

        }));

        it(`400: bad If-None-Match`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `304: Not Modified` }, defaultData);
          const lang = await upsert(coll, data);

          // If-None-Match
          await req.get(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .set(ifNoneMatchHeader, ``)
          .expect(400);

        }));

        it(`403: Forbidden (bad permissions)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lang = await upsert(coll, data);

          await req.get(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {
          await req.get(`${v}/languages/bad-id`)
          .set(`Authorization`, token)
          .expect(404);
        }));

        it(`410: gone`, testAsync(async function() {

          const data = Object.assign({ tid: `deletedLang`, ttl: 300 }, defaultData);
          const lang = await upsert(coll, data);

          await req.get(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .expect(410);

        }));

        it(`200: Success`, testAsync(async function() {

          const data     = Object.assign({ tid: `getLanguage` }, defaultData);
          const langData = await upsert(coll, data);

          const { body: lang, headers } = await req.get(`${v}/languages/${langData.id}`)
          .set(`Authorization`, token)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

        }));

        it(`200: retrieves public items`, testAsync(async function() {

          const data = Object.assign({}, defaultData, {
            permissions: {
              owners: [`some-other-user`],
              public: true,
            },
            tid: `public item`,
          });

          const langData = await upsert(coll, data);

          const { body: lang, headers } = await req.get(`${v}/languages/${langData.id}`)
          .set(`Authorization`, token)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

        }));

      });

      describe(`PATCH`, function() {

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();
          const data  = Object.assign({ tid: `bad scope` }, defaultData);
          const lang  = await upsert(coll, data);

          await req.patch(`${v}/languages/${lang.id}`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .send(lang)
          .expect(403);

        }));

        it(`403: Forbidden (bad permissions)`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } });
          const lang = await upsert(coll, data);

          await req.patch(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .send(lang)
          .expect(403);

        }));

        it(`404: Not Found`, testAsync(async function() {
          await req.patch(`${v}/languages/bad-id`)
          .set(`Authorization`, token)
          .expect(404);
        }));

        it(`412: If-Match precondition not met`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `If-Match not met` }, defaultData);
          const lang = await upsert(coll, data);

          // change data on server
          lang.changedProperty = true;
          await upsert(coll, lang);

          // If-Match
          await req.patch(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .set(ifMatchHeader, lang._etag)
          .send(lang)
          .expect(412);

        }));

        it(`422: Malformed Data`, testAsync(async function() {

          // add test data
          const data = Object.assign({}, defaultData, { tid: `malformed` });
          const lang = await upsert(coll, data);

          // make data malformed
          lang.name = true;

          // attempt to update data
          await req.patch(`${v}/languages/${lang.id}`)
          .set(`Authorization`, token)
          .send(lang)
          .expect(422);

        }));

        it(`200: updated`, testAsync(async function() {

          // add test data
          const data = Object.assign({ tid: `updateLanguage` }, defaultData);
          const langData = await upsert(coll, data);

          // change data for update
          const { id } = langData;
          langData.changedProperty = true;
          delete langData.id; // missing ID in body shouldn't throw an error

          // update Language
          const { body: lang, headers } = await req.patch(`${v}/languages/${id}`)
          .set(`Authorization`, token)
          .send(langData)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang.changedProperty).toBe(true);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(langData._self);

          expect(serverData.type === `Language`).toBe(true);
          expect(serverData.tid).toBe(data.tid);
          expect(serverData.changedProperty).toBe(true);
          expect(serverData.ttl).toBeUndefined();

        }));

        it(`200: undeletes a deleted Language`, testAsync(async function() {

          const data     = Object.assign({ tid: `undeleteLanguage`, ttl: 300 }, defaultData);
          const langData = await upsert(coll, data);

          langData.changedProperty = true;

          // update Language
          const { body: lang, headers } = await req.patch(`${v}/languages/${langData.id}`)
          .set(`Authorization`, token)
          .send(langData)
          .expect(200)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Language attributes
          expect(lang.type).toBe(`Language`);
          expect(lang.tid).toBe(data.tid);
          expect(lang.changedProperty).toBe(true);
          expect(lang._attachments).toBeUndefined();
          expect(lang._rid).toBeUndefined();
          expect(lang._self).toBeUndefined();
          expect(lang.permissions).toBeUndefined();
          expect(lang.ttl).toBeUndefined();

          // check data on server
          const serverData = await read(langData._self);

          expect(serverData.type === `Language`).toBe(true);
          expect(serverData.tid).toBe(data.tid);
          expect(serverData.changedProperty).toBe(true);
          expect(serverData.ttl).toBeUndefined();

        }));

      });

    });

  });

};
