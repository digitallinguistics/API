/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const app    = require('../app');
const db     = require('../lib/db');
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

  const opts = Object.assign({}, defaults, attrs);

  Object.keys(opts).forEach(key => {
    if (!opts[key]) delete opts[key];
  });

  return opts;

};

const secret = config.secret;
const token = jwt.sign(payload(), secret, options());

const clientApp = {
  id:           config.cid,
  type:        'client-app',
  name:        'API Errors Test App',
  secret:       config.secret,
  confidential: true,
  scope:       'public',
  redirects: ['http://localhost:3000/oauth'],
  permissions: {
    owner:       [],
    contributor: [],
    viewer:      [],
    public:      false,
  },
};

// API Errors Spec
describe('API Errors', function() {

  beforeAll(function(done) {
    db.upsertDocument(db.coll, clientApp, err => {
      if (err) return fail(err);
      return done();
    });
  });

  xit('404: No Route', function(done) {
    return req.get('/test')
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .then(done)
    .catch(handleError(done));
  });

  xit('405: Method Not Allowed', function(done) {

  });

  xit('497: Use HTTPS', function(done) {

  });

  xit('credentials_required', function(done) {
    return req.get('/texts')
    .expect(401)
    .then(res => {
      expect(res.headers['www-authenticate']).toBeDefined();
      expect(res.body.code).toBe('credentials_required');
      done();
    }).catch(handleError(done));
  });

  xit('invalid_token: aud missing', function(done) {

    const p = payload({ aud: '' });
    const opts = options({ audience: '' });
    const token = jwt.sign(p, secret, opts);

    return req.get('/texts')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
    .then(res => {
      expect(res.headers['www-authenticate']).toBeDefined();
      done();
    }).catch(handleError(done));

  });

  xit('invalid_token: aud invalid', function(done) {

    const opts = options({ audience: 'https://api.wrongdomain.io' });
    const token = jwt.sign(payload(), secret, opts);

    return req.get('/texts')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
    .then(res => {
      expect(res.headers['www-authenticate']).toBeDefined();
      done();
    }).catch(handleError(done));

  });

  xit('invalid_token: cid missing', function(done) {

    const p = payload({ cid: '' });
    const token = jwt.sign(p, secret, options());

    return req.get('/texts')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
    .then(res => {
      expect(res.headers['www-authenticate']).toBeDefined();
      done();
    }).catch(handleError(done));

  });

  xit('invalid_token: cid invalid', function(done) {

    const p = payload({ cid: 'a1b2c3d4e5' });
    const token = jwt.sign(p, secret, options());

    return req.get('/texts')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
    .then(res => {
      expect(res.headers['www-authenticate']).toBeDefined();
      done();
    }).catch(handleError(done));

  });

  xit('invalid_token: iss missing', function(done) {

  });

  xit('invalid_token: iss invalid', function(done) {

    const p = payload({ iss: 'https://login.wrongdomain.io' });
    const opts = options({ issuer: '' });
    const token = jwt.sign(p, secret, opts);

    return req.get('/texts')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
    .then(res => {
      expect(res.headers['www-authenticate']).toBeDefined();
      done();
    }).catch(handleError(done));

  });

  xit('token_expired', function(done) {
    // TODO: rename this test?
  });

});
