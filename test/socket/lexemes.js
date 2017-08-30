/* eslint-disable
  func-names,
  max-nested-callbacks,
  prefer-arrow-callback,
*/

const config = require('../../lib/config');

const {
  authenticate,
  db,
  getToken,
  testAsync,
} = require('../utilities');

const { coll, upsert } = db;

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
  lemma: {},
  permissions,
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

module.exports = (v = ``) => {

  describe(`Lexemes`, function() {

    let token;
    let client;
    let emit;

    beforeAll(testAsync(async function() {

      token  = await getToken();
      client = await authenticate(v, token);

      emit = (...args) => new Promise((resolve, reject) => {
        client.emit(...args, (err, res, info) => {
          if (err) return reject(err);
          resolve({ info, res });
        });
      });

      await upsert(coll, lang);

    }));

    it(`add`, testAsync(async function() {

      // add Lexeme with Language that exists
      const data = Object.assign({ tid: `addLexeme` }, defaultData);
      const { res }  = await emit(`add`, `Lexeme`, data);
      expect(res.tid).toBe(data.tid);

      // add Lexeme with Language that does not exist
      const lex1 = Object.assign({}, defaultData, { languageID: `678910` });

      try {
        const { info } = await emit(`add`, `Lexeme`, lex1);
        expect(info.status).not.toBe(201);
      } catch (e) {
        expect(e.status).toBe(404);
      }

      // add Lexeme without Language specified
      const lex2 = Object.assign({}, defaultData);
      delete lex2.languageID;

      try {
        const { info } = await emit(`add`, `Lexeme`, lex2);
        expect(info.status).not.toBe(201);
      } catch (e) {
        expect(e.status).toBe(400);
      }

    }));

  });

};
