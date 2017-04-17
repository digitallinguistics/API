/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  object-curly-newline,
  object-property-newline,
  prefer-arrow-callback
*/

const config      = require(`../lib/config`);
const handleError = require(`./handleError`);
const jwt         = require(`jsonwebtoken`);

const ttl = 500; // 3 minutes

module.exports = (req, v = ``) => {

  describe(`Routes`, function() {

    beforeAll(function(done) {

      const opts = {
        audience: config.authClientId,
        issuer:   `https://${config.authDomain}/`,
        subject:  config.testUser,
      };

      jwt.sign({}, config.authSecret, opts, (err, token) => {
        if (err) return fail(err);
        this.token = token;
        done();
      });

    });

    // test ID
    const tid = `testlanguage`;

    xit(`returns simplified data objects`, function() {
      // TODO: test upserting an empty property
      // you should receive it back without that property
    });

    it(`PUT /languages (one language)`, function(done) {

      const lang = { tid, ttl };

      return req
      .put(`${v}/languages`)
      .send(lang)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .expect(res => expect(res.body.tid).toBe(tid))
      .then(done)
      .catch(handleError(done));

    });

    xit(`PUT /languages (multiple languages)`, function() {
      return req
      .put(`${v}/languages`)
      .send([
        { tid: `lang1`, ttl },
        { tid: `lang2`, ttl },
      ])
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(201)
      .then(res => expect(Array.isArray(res)).toBe(true))
      .catch(fail);
    });

    xit(`PUT /languages/{language}`, function() {
      return req
      .put(`${v}/languages/lang1`)
      .send({ tid: `lang1`, hello: `world`, ttl })
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .then(res => expect(res.hello).toBe(`world`))
      .catch(fail);
    });

    xit(`GET /languages`, function() {
      return req
      .get(`${v}/languages`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .then(res => expect(Array.isArray(res)).toBe(true))
      .catch(fail);
    });

    xit(`GET /languages?ids={ids}`, function() {
      return req
      .get(`${v}/languages?ids=${tid}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .then(res => {
        expect(Array.isArray(res)).toBe(true);
        expect(Array.length).toBe(1);
        expect(res[0].id).toBe(tid);
      })
      .catch(fail);
    });

    xit(`GET /languages/{language}`, function() {
      return req
      .get(`${v}/languages/${tid}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .then(res => expect(res.id).toBe(tid))
      .catch(fail);
    });

    xit(`DELETE /languages/{language}`, function() {
      return req
      .delete(`${v}/languages/${tid}`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(204)
      .catch(fail);
    });

    xit(`DELETE /languages`, function() {
      return req
      .delete(`${v}/languages?ids=lang1,lang2`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(204)
      .catch(fail);
    });

  });

};
