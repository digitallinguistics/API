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
  testAsync,
} = require('../utilities');

const {
  coll,
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

    });

    describe(`/lexemes/{lexeme}`, function() {

      it(`405: Method Not Allowed`, testAsync(async function() {

        const lex = await upsert(coll, defaultData);

        await req.post(`${v}/lexemes/${lex.id}`)
        .set(`Authorization`, token)
        .expect(405);

      }));

    });

  });

};
