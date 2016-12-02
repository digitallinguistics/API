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
const config = require('../lib/config');
const db     = require('../lib/db');
const http   = require('http');
const jwt    = require('jsonwebtoken');
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
const p = payload();
const opts = options();
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

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (v = '') => {

  // API Errors Spec
  describe('API Errors', function() {

    beforeAll(function(done) {
      db.upsertDocument(db.coll, clientApp, err => {
        if (err) return fail(err);
        return done();
      });
    });

    it('HTTP > HTTPS', function(done) {

      // TODO: change this URL once you've enabled the api.digitallinguistics.io domain
      const req = http.get(`http://dlx-api.azurewebsites.net/test`, res => {

        let data = '';

        res.on('error', fail);
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          expect(res.headers.location.includes('https')).toBe(true);
          done();
        });

      });

      req.on('error', fail);

    });

    it('404: No Route', function(done) {
      return req.get(`${v}/badroute`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .then(done)
      .catch(handleError(done));
    });

    it('405: Method Not Allowed', function(done) {
      return req.post(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(405)
      .then(done)
      .catch(handleError(done));
    });

    it('credentials_required', function(done) {
      req.get(`${v}/test`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        expect(res.body.code).toBe('credentials_required');
        done();
      }).catch(handleError(done));
    });

    it('invalid_token: aud missing', function(done) {

      const p = payload({ aud: '' });
      const opts = options({ audience: '' });
      const token = jwt.sign(p, secret, opts);

      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        done();
      }).catch(handleError(done));

    });

    it('invalid_token: aud invalid', function(done) {

      const opts = options({ audience: 'https://api.wrongdomain.io' });
      const token = jwt.sign(p, secret, opts);

      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        done();
      }).catch(handleError(done));

    });

    it('invalid_token: cid missing', function(done) {

      const p = payload({ cid: '' });
      const token = jwt.sign(p, secret, opts);

      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        done();
      }).catch(handleError(done));

    });

    it('invalid_token: cid invalid', function(done) {

      const p = payload({ cid: 'a1b2c3d4e5' });
      const token = jwt.sign(p, secret, opts);

      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        done();
      }).catch(handleError(done));

    });

    it('invalid_token: iss missing', function(done) {

      const p = payload({ iss: '' });
      const token = jwt.sign(p, secret, options({ issuer: '' }));

      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        done();
      }).catch(handleError(done));

    });

    it('invalid_token: iss invalid', function(done) {

      const p = payload({ iss: 'https://login.wrongdomain.io' });
      const opts = options({ issuer: '' });
      const token = jwt.sign(p, secret, opts);

      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        done();
      }).catch(handleError(done));

    });

    it('invalid_token: expired', function(done) {

      const opts = options({ expiresIn: 1 });
      const token = jwt.sign(p, secret, opts);

      setTimeout(() => {
        req.get(`${v}/test`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401)
        .then(done)
        .catch(handleError(done));
      }, 1500);

    }, 10000);

    it('GET /test', function(done) {
      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then(res => {
        expect(res.body.message).toBe('Test successful.');
        done();
      }).catch(handleError(done));
    });

  });

};
