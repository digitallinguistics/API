const credentials = require('../lib/credentials');
const http = require('http');
const jwt = require('jsonwebtoken');

describe('/oauth', function () {

  const token = (payload, opts) => {
    const defaultPayload = { scope: 'db', service: 'onedrive' };
    const defaultOpts = {
      algorithm: 'RS256',
      audience: 'https://api.digitallinguistics.org',
      expiresIn: 300,
      jwtid: '1234567890',
      subject: '010101'
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

  beforeAll(function () {
    console.log('OAuth: starting');
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

  it('returns a 401 response if the service claim is missing');

  it('returns a 401 response if the JWT ID (state) is missing');

  it('returns a 403 response if the scope is not `db`');

  it('returns a 405 response for non-POST requests');

  // should include the original state as well as a DLx token in the querystring
  it('redirects to the original redirect URI if the token is valid');

});
