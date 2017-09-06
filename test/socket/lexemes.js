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
const type       = `Lexeme`;

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
  type,
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

    it(`addLexeme`, testAsync(async function() {

      // add Lexeme with Language that exists
      const data = Object.assign({ tid: `addLexeme` }, defaultData);
      const { res }  = await emit(`addLexeme`, data);
      expect(res.tid).toBe(data.tid);

      // add Lexeme with Language that does not exist
      const lex1 = Object.assign({}, defaultData);

      try {
        const { info } = await emit(`addLexeme`, lex1, { languageID: `678910` });
        expect(info.status).toBe(404);
      } catch (e) {
        expect(e.status).toBe(404);
      }

      // add Lexeme without Language specified
      const lex2 = Object.assign({}, defaultData);
      delete lex2.languageID;

      try {
        const { info } = await emit(`addLexeme`, lex2);
        expect(info.status).not.toBe(201);
      } catch (e) {
        expect(e.status).toBe(400);
      }

    }));

    it(`deleteLexeme`, testAsync(async function() {
      const doc     = await upsert(coll, Object.assign({}, defaultData));
      const { res } = await emit(`deleteLexeme`, doc.id);
      expect(res.status).toBe(204);
    }));

    it(`getLexeme`, testAsync(async function() {
      const doc = await upsert(coll, Object.assign({ tid: `get` }, defaultData));
      const { res: lex } = await emit(`getLexeme`, doc.id);
      expect(lex.tid).toBe(`get`);
    }));

    it(`getLexemes`, testAsync(async function() {

      const data = {
        languageID,
        lemma: {},
        permissions: { owner: [`some-other-user`] },
        test,
        tid: `getAll`,
        type,
      };

      const doc = await upsert(coll, data);
      await upsert(coll, Object.assign({}, defaultData));
      const { res, info } = await emit(`getLexemes`, languageID);

      expect(res.length).toBeGreaterThan(0);
      expect(info.itemCount).toBeGreaterThan(0);
      expect(res.some(item => item.tid === doc.tid)).toBe(false);

    }));

    it(`updateLexeme`, testAsync(async function() {

      const data = Object.assign({
        notChanged: `This property should not be changed.`,
        tid:        `upsertOne`,
      }, defaultData);

      const doc = await upsert(coll, data);

      const newData = {
        id: doc.id,
        test,
        tid: `upsertOneAgain`,
        type,
      };

      const { res } = await emit(`updateLexeme`, newData);

      expect(res.notChanged).toBe(doc.notChanged);
      expect(res.tid).toBe(newData.tid);

    }));

    it(`upsertLexeme`, testAsync(async function() {
      const data = Object.assign({ tid: `upsert` }, defaultData);
      const { res } = await emit(`upsertLexeme`, data);
      expect(res.tid).toBe(data.tid);
    }));

  });

};
