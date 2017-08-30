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
const test       = true;

const permissions = {
  contributors: [],
  owners:       [config.testUser],
  public:       false,
  viewers:      [],
};

const defaultData = {
  languageID,
  lemma:       {},
  permissions,
  senses:      [],
  test,
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

    it(`GET /languages/:language/lexemes?public=true`, testAsync(async function() {

      const lex1 = await upsert(coll, Object.assign({}, defaultData, { permissions: { owners: [`some-other-user`] } }));
      const lex2 = await upsert(coll, Object.assign({}, defaultData, { permissions: { public: true } }));

      const { body } = await req.get(`${v}/languages/${languageID}/lexemes`)
      .set(`Authorization`, `Bearer ${token}`)
      .query({ public: true })
      .expect(`dlx-item-count`, /[0-9]+/)
      .expect(200);

      expect(body.some(lex => lex.id === lex1.id)).toBe(false);
      expect(body.some(lex => lex.id === lex2.id)).toBe(true);

    }));

    it(`POST /languages/:language/lexemes`, testAsync(async function() {

      const lang = {
        id: languageID,
        name: {},
        permissions,
        test,
        type: `Language`,
      };

      await upsert(coll, lang);

      const data = Object.assign({}, defaultData);
      delete data.languageID;

      const { body } = await req.post(`${v}/languages/${languageID}/lexemes`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(Object.assign({}, defaultData))
      .expect(`Last-Modified`, /.+/)
      .expect(201);

      expect(body.languageID).toBe(lang.id);

      await req.post(`${v}/languages/678910/lexemes`)
      .set(`Authorization`, `Bearer ${token}`)
      .send(Object.assign({}, data))
      .expect(404);

    }));

    xit(`PUT /languages/:language/lexemes`, testAsync(async function() {
      pending(`Test not yet written.`);
    }));

  });

};
