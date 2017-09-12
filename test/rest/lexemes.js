/* eslint-disable
  func-names,
  max-nested-callbacks,
  no-magic-numbers,
  no-underscore-dangle,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');
const uuid   = require('uuid/v4');

const {
  db,
  getToken,
  headers,
  testAsync,
  timeout,
} = require('../utilities');

const {
  coll,
  upsert,
} = db;

const {
  continuationHeader,
  ifModifiedSinceHeader,
  itemCountHeader,
  maxItemsHeader,
} = headers;

const languageID = uuid();
const test       = true;

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

const lang = {
  id: languageID,
  name: {},
  permissions,
  test,
  type: `Language`,
};

module.exports = (req, v = ``) => {

  describe(`Lexemes`, function() {

    let token;

    beforeAll(testAsync(async function() {
      const res = await getToken();
      token = `Bearer ${res}`;
      await upsert(coll, lang);
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
          expect(lexemes.some(lex => lex.id === lex1.id && lex.tid === lex1.tid)).toBe(true);
          expect(lexemes.some(lex => lex.id === lex2.id && lex.tid === lex2.tid)).toBe(true);

          // only items that the user has permission to view should be included in the results
          expect(lexemes.some(lex => lex.id === lex3.id && lex.tid === lex3.tid)).toBe(false);

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

          // returns only Lexemes that the user has permission to access

        }));

        it(`public`, testAsync(async function() {

          // does not return public results with bad public value
          // does not return private results

        }));

      });

      describe(`POST`, function() {

      });

      describe(`PUT`, function() {

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
