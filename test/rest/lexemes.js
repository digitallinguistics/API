/* eslint-disable
  func-names,
  max-nested-callbacks,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');
const uuid   = require('uuid/v4');

const {
  db,
  getToken,
  headers,
  testAsync,
} = require('../utilities');

const {
  coll,
  upsert,
} = db;

const {
  continuationHeader,
  ifModifiedSinceHeader,
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

        }));

        it(`dlx-max-item-count / dlx-continuation`, testAsync(async function() {

        }));

        it(`If-Modified-Since`, testAsync(async function() {

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
