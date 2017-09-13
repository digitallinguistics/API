/* eslint-disable
  func-names,
  max-nested-callbacks,
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
  ifModifiedSinceHeader,
  itemCountHeader,
  lastModifiedHeader,
  maxItemsHeader,
} = headers;

module.exports = (req, v = ``) => {

  describe(`Lexemes`, function() {

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

    describe(`/lexemes`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {
        await req.delete(`${v}/lexemes`)
        .set(`Authorization`, token)
        .expect(405);
      }));

      describe(`GET`, function() {

        it(`400: bad languageID`, testAsync(async function() {
          await req.get(`${v}/lexemes`)
          .set(`Authorization`, token)
          .query({ languageID: '' }) // NB: testing with true doesn't work here, because it results in a valid, non-empty string
          .expect(400);
        }));

        it(`400: bad dlx-max-item-count`, testAsync(async function() {
          await req.get(`${v}/lexemes`)
          .set(`Authorization`, token)
          .set(maxItemsHeader, true)
          .expect(400);
        }));

        it(`400: bad dlx-continuation`, testAsync(async function() {
          await req.get(`${v}/lexemes`)
          .set(`Authorization`, token)
          .set(continuationHeader, true)
          .expect(400);
        }));

        it(`400: bad If-Modified-Since`, testAsync(async function() {
          await req.get(`${v}/lexemes`)
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
          const { body: lexemes } = await req.get(`${v}/lexemes`)
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

        }));

        it(`200: returns Lexemes even if user doesn't have permissions for Language`, testAsync(async function() {

        }));

        it(`dlx-max-item-count / dlx-continuation`, testAsync(async function() {

          // add test data
          await upsert(coll, Object.assign({ tid: `getLexemes-continuation1` }, defaultData));
          await upsert(coll, Object.assign({ tid: `getLexemes-continuation2` }, defaultData));
          await upsert(coll, Object.assign({ tid: `getLexemes-continuation3` }, defaultData));

          // dlx-max-item-count
          const res = await req.get(`${v}/lexemes`)
          .set(`Authorization`, token)
          .set(maxItemsHeader, 2)
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
          const { body: lexemes } = await req.get(`${v}/lexemes`)
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

          const { body: lexemes } = await req.get(`${v}/lexemes`)
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

        it(`languageID`, testAsync(async function() {

          // add test data
          const lang     = await upsert(coll, Object.assign({}, langData, { id: uuid() }));
          const lexData1 = Object.assign({}, defaultData, { languageID: lang.id });
          const lexData2 = Object.assign({}, defaultData);

          const lex1 = await upsert(coll, lexData1);
          const lex2 = await upsert(coll, lexData2);

          // get Lexemes for Language
          const { body: lexemes } = await req.get(`${v}/lexemes`)
          .set(`Authorization`, token)
          .query({ languageID: lang.id })
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          // returns only Lexemes that the user has permission to access
          expect(lexemes.find(lex => lex.id === lex1.id)).toBeDefined();
          expect(lexemes.find(lex => lex.id === lex2.id)).toBeUndefined();

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
          const { body: badLexemes } = await req.get(`${v}/lexemes`)
          .set(`Authorization`, token)
          .query({ public: `yes` })
          .expect(200)
          .expect(itemCountHeader, /[0-9]+/);

          expect(badLexemes.find(lang => lang.id === publicLex.id)).toBeUndefined();
          expect(badLexemes.find(lang => lang.id === privateLex.id)).toBeUndefined();

          // request public items
          const { body: lexemes } = await req.get(`${v}/lexemes`)
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

        it(`400: missing languageID`, testAsync(async function() {
          await req.post(`${v}/lexemes`)
          .set(`Authorization`, token)
          .send({})
          .expect(400);
        }));

        it(`403: bad scope`, testAsync(async function() {

          const badToken = await getBadToken();

          await req.post(`${v}/lexemes`)
          .set(`Authorization`, `Bearer ${badToken}`)
          .expect(403);

        }));

        it(`403: no permissions for Language`, testAsync(async function() {

          const data    = Object.assign({}, langData, { id: uuid(), permissions: { owners: [`some-other-user`] } });
          const lang    = await upsert(coll, data);
          const lexData = Object.assign({}, defaultData, { languageID: lang.id });

          await req.post(`${v}/lexemes`)
          .set(`Authorization`, token)
          .send(lexData)
          .expect(403);

        }));

        it(`422: Malformed data`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { lemma: true });

          await req.post(`${v}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(422);

        }));

        it(`201: Created`, testAsync(async function() {

          const data = Object.assign({}, defaultData, { id: uuid(), tid: `addLexeme` });

          const { body: lex, headers } = await req.post(`${v}/lexemes`)
          .set(`Authorization`, token)
          .send(data)
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.id).not.toBe(data.id);
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

        it(`languageID (query)`, testAsync(async function() {

          // missing body creates a new Lexeme
          const { body: lex, headers } = await req.post(`${v}/lexemes`)
          .set(`Authorization`, token)
          .query({ languageID: langData.id })
          .expect(201)
          .expect(lastModifiedHeader, /.+/);

          // Last-Modified header should be a valid date string
          expect(Number.isInteger(Date.parse(headers[lastModifiedHeader]))).toBe(true);

          // check Lexeme attributes
          expect(lex.type).toBe(`Lexeme`);
          expect(lex.languageID).toBe(langData.id);
          expect(lex._attachments).toBeUndefined();
          expect(lex._rid).toBeUndefined();
          expect(lex._self).toBeUndefined();
          expect(lex.permissions).toBeUndefined();
          expect(lex.ttl).toBeUndefined();

        }));

      });

      fdescribe(`PUT`, function() {

        it(`400: missing languageID`, function() {

        });

        it(`languageID (query)`, function() {

        });

      });

    });

    describe(`/lexemes/{lexeme}`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {

        const lex = await upsert(coll, defaultData);

        await req.post(`${v}/lexemes/${lex.id}`)
        .set(`Authorization`, token)
        .expect(405);

      }));

      describe(`DELETE`, function() {

      });

      describe(`GET`, function() {

      });

      describe(`PATCH`, function() {

      });

    });

  });

};
