/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const getToken    = require(`./getToken`);
const handleError = require(`./handleError`);
const http        = require(`http`);

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = ``) => {

  describe(`API Errors`, function() {

    beforeAll(function(done) {
      getToken()
      .then(token => { this.token = token; })
      .then(done)
      .catch(fail);
    });

    it(`HTTP > HTTPS`, function(done) {

      const req = http.get(`http://api.digitallinguistics.io/test`, res => {
        let data = ``;
        res.on(`error`, fail);
        res.on(`data`, chunk => { data += chunk; });
        res.on(`end`, () => {
          expect(res.headers.location.includes(`https`)).toBe(true);
          done();
        });
      });

      req.on(`error`, fail);

    });

    it(`404: No Route`, function(done) {
      return req.get(`${v}/badroute`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(404)
      .then(done)
      .catch(handleError(done));
    });

    it(`405: Method Not Allowed`, function(done) {
      return req.post(`${v}/test`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(405)
      .then(done)
      .catch(handleError(done));
    });

    it(`credentials_required`, function(done) {
      req.get(`${v}/test`)
      .expect(401)
      .then(res => {
        expect(res.headers[`www-authenticate`]).toBeDefined();
        expect(res.body.error).toBe(`credentials_required`);
        done();
      }).catch(handleError(done));
    });

    it(`GET /test`, function(done) {
      req.get(`${v}/test`)
      .set(`Authorization`, `Bearer ${this.token}`)
      .expect(200)
      .then(res => {
        expect(res.body.message).toBe(`Test successful.`);
        done();
      }).catch(handleError(done));
    });

    it(`malformed data`, function() {
      // data doesn`t adhere to DLx spec
    });

    it(`bad permissions`, function() {
      // user doesn`t have permission to access a resource
    });

    it(`enforces rate limits`, function() {
    });

    it(`supports pagination`, function() {
    });

    it(`does not allow public clients to modify data`, function() {
      // TODO: should not allow PUT or DELETE methods
    });

  });

};
