/* eslint-disable
  func-names,
  max-nested-callbacks,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');

const {
  db,
  getToken,
  testAsync,
} = require('../utilities');

const {
  coll,
  upsert,
} = db;

const languageID = `12345`;

const defaultData = {
  languageID,
  lemma:       {},
  permissions: { owners: [config.testUser] },
  senses:      [],
  test:        true,
  type:        `Lexeme`,
};

module.exports = (req, v = ``) => {

  describe(`Lexemes`, function() {

    let token;

    beforeAll(testAsync(async function() {
      token = await getToken();
    }));

    it(`GET /languages/:language/lexemes`, testAsync(async function() {

      const lex1 = await upsert(coll, Object.assign({}, defaultData));
      const lex2 = await upsert(coll, Object.assign({}, defaultData));
      const lex3 = await upsert(coll, Object.assign({}, defaultData, { languageID: `678910` }));

      const { body } = await req.get(`${v}/languages/${languageID}/lexemes`)
      .set(`Authorization`, `Bearer ${token}`)
      .expect(`dlx-item-count`, /[0-9]+/)
      .expect(200);

      expect(body.some(lex => lex.id === lex1.id)).toBe(true);
      expect(body.some(lex => lex.id === lex2.id)).toBe(true);
      expect(body.some(lex => lex.id === lex3.id)).toBe(false);

    }));

    xit(`POST /languages/:language/lexemes`, testAsync(async function() {
      pending(`Test not yet written.`);
    }));

    xit(`PUT /languages/:language/lexemes`, testAsync(async function() {
      pending(`Test not yet written.`);
    }));

  });

};
