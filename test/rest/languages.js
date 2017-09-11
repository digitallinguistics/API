/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-invalid-this,
  no-magic-numbers,
  no-underscore-dangle,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');

const {
  db,
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
  itemCountHeader,
  maxItemsHeader,
  ifModifiedSinceHeader,
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

        it(`no options`, testAsync(async function() {

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
          .expect(`dlx-item-count`, /[0-9]+/)
          .expect(200);

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

          // bad dlx-max-item-count value returns 400
          await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(maxItemsHeader, true)
          .expect(400);

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

          // bad continuation header returns 400
          await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(continuationHeader, true)
          .expect(400);

          // dlx-continuation
          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(continuationHeader, res.headers[continuationHeader])
          .expect(itemCountHeader, /[0-9]+/)
          .expect(200);

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

          // bad If-Modified-Since value returns 400
          await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifModifiedSinceHeader, true)
          .expect(400);

          // If-Modified-Since
          const ifModifiedSince = new Date((lang1._ts * 1000) + 1000); // add 1s to timestamp of modifiedBefore

          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .set(ifModifiedSinceHeader, ifModifiedSince)
          .expect(itemCountHeader, /[0-9]+/)
          .expect(200);

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

        it(`public=true`, testAsync(async function() {

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
          .expect(itemCountHeader, /[0-9]+/)
          .expect(200);

          expect(badLangs.find(lang => lang.id === publicLang.id)).toBeUndefined();
          expect(badLangs.find(lang => lang.id === privateLang.id)).toBeUndefined();

          // request public items
          const { body: langs } = await req.get(`${v}/languages`)
          .set(`Authorization`, token)
          .query({ public: true })
          .expect(itemCountHeader, /[0-9]+/)
          .expect(200);

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

        // missing body returns 400
        // 403: bad edit scope
        // malformed data returns 422
        // provided ID is deleted
        // add Language
        // status === 201
        // type === Language
        // no database properties (_attachments, _rid, _self, permissions)
        // check data on server
        // - permissions set properly

      });

      describe(`PUT`, function() {

        // missing body returns 400
        // 403: bad edit scope
        // 403: bad permissions for item
        // 404: not found
        // 422: malformed

        // create a Language
        // If-Match ignored when there is no ID
        // status === 201
        // type === Language
        // no database properties
        // check data on server
        // - type === Language
        // - permissions set properly
        // - tid

        // replace a Language
        // check status, type, db props
        // check data on server

        // replace a Language (If-Match)
        // - returns 201 if data has not been updated
        // - returns 412 if data has been updated
        // for both, check status, type, db props, and data on server

        // upserting a deleted language undeletes it

      });

    });

    describe(`/languages/{language}`, function() {

      it(`405: Method Not Allowed`, function() {

      });

      it(`DELETE`, testAsync(async function() {

      }));

      it(`GET`, testAsync(async function() {

      }));

      it(`PATCH`, testAsync(async function() {

      }));

    });

  });

};

// module.exports = (req, v = ``) => {
//
//   describe(`Languages`, function() {
//
//     it(`deletes Lexemes when a Language is deleted`, testAsync(async function() {
//
//       const lang = await upsert(coll, Object.assign({}, defaultData));
//
//       const lexData = {
//         languageID:  lang.id,
//         lemma:       {},
//         permissions,
//         senses:      [],
//         test,
//         type:        `Lexeme`,
//       };
//
//       const lex = await upsert(coll, lexData);
//
//       await req.delete(`${v}/languages/${lang.id}`)
//       .set(`Authorization`, token)
//       .expect(204);
//
//       await timeout(500);
//
//       const res = await read(`${coll}/docs/${lex.id}`);
//       expect(res.ttl).toBeDefined();
//
//     }));
//
//     it(`DELETE /languages/{language}`, testAsync(async function() {
//
//       const doc = await upsert(coll, Object.assign({}, defaultData));
//
//       await req.delete(`${v}/languages/${doc.id}`)
//       .set(`Authorization`, token)
//       .expect(204);
//
//     }));
//
//     it(`POST /languages`, testAsync(async function() {
//
//       const res = await req.post(`${v}/languages`)
//       .set(`Authorization`, token)
//       .send(Object.assign({ tid: `post` }, defaultData))
//       .expect(201);
//
//       expect(res.body.tid).toBe(`post`);
//
//     }));
//
//     it(`PUT /languages`, testAsync(async function() {
//
//       const data = Object.assign({ tid: `put` }, defaultData);
//
//       // test create
//       const res1 = await req.put(`${v}/languages`)
//       .set(`Authorization`, token)
//       .send(data)
//       .expect(201);
//
//       // test upsert
//       const res2 = await req.put(`${v}/languages`)
//       .set(`Authorization`, token)
//       .send(Object.assign(res1.body, { newProp: true }))
//       .expect(201);
//
//       expect(typeof res2.headers[`last-modified`]).toBe(`string`);
//       expect(res2.headers[`last-modified`]).not.toBe(`Invalid Date`);
//       expect(res2.body.tid).toBe(data.tid);
//       expect(res2.body.newProp).toBe(true);
//
//     }));
//
//     it(`PATCH /languages/{language}`, testAsync(async function() {
//
//       const data = Object.assign({
//         notChanged: `This property should not be changed.`,
//         tid:        `upsertOne`,
//       }, defaultData);
//
//       const doc = await upsert(coll, data);
//
//       const res = await req.patch(`${v}/languages/${doc.id}`)
//       .send({ tid: `upsertOneAgain` })
//       .set(`Authorization`, token)
//       .expect(200);
//
//       expect(typeof res.headers[`last-modified`]).toBe(`string`);
//       expect(res.headers[`last-modified`]).not.toBe(`Invalid Date`);
//       expect(res.body.notChanged).toBe(data.notChanged);
//       expect(res.body.tid).toBe(`upsertOneAgain`);
//
//     }));
//
//
//     it(`GET /languages/{language}`, testAsync(async function() {
//
//       const doc = await upsert(coll, Object.assign({ tid: `getLanguage` }, defaultData));
//
//       const res = await req.get(`${v}/languages/${doc.id}`)
//       .set(`Authorization`, token)
//       .expect(200);
//
//       expect(res.headers[`last-modified`]).toBeDefined();
//       expect(res.body.tid).toBe(doc.tid);
//
//     }));
//
//   });
//
// };
