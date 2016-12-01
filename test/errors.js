/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  prefer-arrow-callback
*/

const app    = require('../app');
const jwt    = require('jsonwebtoken');
const config = require('../../credentials/dlx-api-spec.js');
const req    = require('supertest-as-promised').agent(app);

const handleError = done => {
  return function(err) {
    fail(err);
    done();
  };
};

const payload = (attrs = {}) => {

  const defaults = {
    cid: config.cid,
    scp: 'public',
  };

  return Object.assign({}, defaults, attrs);

};

const options = (attrs = {}) => {

  const defaults = {
    algorithm: 'HS256',
    expiresIn:  3600,
    audience:  'https://api.digitallinguistics.io',
    issuer:    'https://login.digitallinguistics.io',
    jwtid:      config.jwtid,
    subject:    config.subject,
  };

  return Object.assign({}, defaults, attrs);

};

const secret = config.secret;
const token = jwt.sign(payload(), secret, options());

// API Errors Spec
describe('API Errors', function() {

  xit('404: No Route', function(done) {

  });

  xit('405: Method Not Allowed', function(done) {

  });

  xit('497: Use HTTPS', function(done) {

  });

  it('credentials_required', function(done) {
    return req.get('/texts')
    .expect(401)
    .then(res => {
      expect(res.body.code).toBe('credentials_required');
      done();
    }).catch(handleError(done));
  });

  xit('invalid_token: aud missing', function(done) {
  });

  xit('invalid_token: aud invalid', function(done) {

  });

  xit('invalid_token: cid missing', function(done) {

  });

  xit('invalid_token: cid invalid', function(done) {

  });

  xit('invalid_token: iss missing', function(done) {

  });

  xit('invalid_token: iss invalid', function(done) {

  });

  xit('invalid_token: jti missing', function(done) {

  });

  xit('invalid_token: jti invalid', function(done) {

  });

  xit('invalid_token: scp missing', function(done) {

  });

  xit('invalid_token: scp invalid', function(done) {

  });

  xit('invalid_token: sub invalid', function(done) {

  });

  xit('token_expired', function(done) {
    // TODO: rename this test?
  });

});
