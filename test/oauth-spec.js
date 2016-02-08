const credentials = require('../lib/credentials');
const db = require('../lib/db');
const http = require('http');
const jwt = require('jsonwebtoken');
const User = require('../lib/models/user');

describe('/oauth', function () {

  const token = (payload, opts) => {
    const defaultPayload = { scope: 'db', service: 'onedrive' };
    const defaultOpts = {
      algorithm: 'RS256',
      audience: 'https://api.digitallinguistics.org',
      expiresIn: 300,
      jwtid: '1234567890',
      subject: 'testy@testing.test'
    };
    payload = payload || {};
    opts = opts || {};
    Object.assign(defaultPayload, payload);
    Object.assign(defaultOpts, opts);
    return jwt.sign(defaultPayload, credentials.key, defaultOpts);
  };

  const options = props => {
    props = props || {};
    const defaults = {
      hostname: 'localhost',
      method: 'POST',
      path: '/oauth',
      port: 3000,
      headers: { Authorization: `Bearer ${token()}` }
    };
    Object.assign(defaults, props);
    return defaults;
  };

  const makeRequest = (opts, handler) => {
    http.request(opts || options(), res => {
      var data = '';
      res.on('data', chunk => data += chunk);
      res.on('error', err => fail(err));
      res.on('end', () => handler(JSON.parse(data)));
    }).end();
  };

  beforeAll(function (done) {
    const user = new User({
      id: 'testy@testing.test',
      firstName: 'Testy',
      lastName: 'McTester',
      services: {
        onedrive: '1234567890'
      }
    });
    db.upsert('users', user).then(user => {
      this.user = new User(user);
      done();
    }).catch(err => console.error(err));
  });

  afterAll(function () {
    console.log('OAuth: finished');
  });

  it('returns a 401 response if the token is missing', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const opts = options({ headers: {} });
    makeRequest(opts, handler);
  });

  it('returns a 401 response if the token is invalid', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const opts = options({ headers: { Authorization: `Bearer ${token() + 'hello'}` } });
    makeRequest(opts, handler);
  });

  it('returns a 401 response if the sub claim is missing', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const t = token(null, { subject: undefined });
    const opts = options({ headers: { Authorization: `Bearer ${t}` } });
    makeRequest(opts, handler);
  });

  it('returns a 401 response if the service claim is missing', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const t = token({ service: undefined });
    const opts = options({ headers: { Authorization: `Bearer ${t}` } });
    makeRequest(opts, handler);
  });

  it('returns a 401 response if the JWT ID (state) is missing', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const t = token(null, { jwtid: undefined });
    const opts = options({ headers: { Authorization:`Bearer ${t}` } });
    makeRequest(opts, handler);
  });

  it('returns a 401 response if the scope is `user` but not `cid` claim is present', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const t = token({ scope: 'user' });
    const opts = options({ headers: { Authorization: `Bearer ${t}` } });
    makeRequest(opts, handler);
  });

  it('returns a 401 response if the scope is not `user` or `db`', function (done) {
    const handler = result => {
      expect(result.status).toEqual(401);
      done();
    };
    const t = token({ scope: 'all the things' });
    const opts = options({ headers: { Authorization: `Bearer ${t}` } });
    makeRequest(opts, handler);
  });

  it('returns a 405 response for non-POST requests', function (done) {
    const handler = result => {
      console.log(result);
      expect(result.status).toEqual(405);
      done();
    };
    const opts = options({ method: 'GET' });
    makeRequest(opts, handler);
  });

  // should include the original state as well as a DLx token in the querystring
  it('redirects to the original redirect URI if the token is valid');

});
