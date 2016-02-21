const ClientApp = require('../lib/models/client-app');
const credentials = require('../lib/credentials');
const db = require('../lib/db');
const http = require('http');
const jwt = require('jsonwebtoken');
const qs = require('querystring');
const User = require('../lib/models/user');
const uuid = require('uuid');

describe('/oauth', function () {

  const makeRequest = (opts, handler) => {
    http.request(opts, res => {
      var data = '';
      res.on('data', chunk => data += chunk);
      res.on('error', err => fail(err));
      res.on('end', () => {
        const result = data.startsWith('{') ? JSON.parse(data) : data;
        handler(result, res);
      });
    }).end();
  };

  beforeAll(function (done) {
    console.log('OAuth: starting');
    db.upsert('apps', new ClientApp({ name: 'OAuth Test App' }))
    .then(app => this.app = new ClientApp(app))
    .then(() => db.upsert('users', new User({ firstName: 'OAuth', lastName: 'Test User' })))
    .then(user => {
      this.user = new User(user);
      this.token = options => {
        const opts = {
          algorithm: 'RS256',
          audience: 'https://api.digitallinguistics.org',
          expiresIn: 3600,
          jwtid: this.state
        };
        Object.assign(opts, options);
        return jwt.sign({}, credentials.key, opts);
      };
      this.options = props => {
        const defaults = {
          hostname: 'localhost',
          method: 'POST',
          path: '/oauth',
          port: 3000,
          headers: {
            Authorization: `Bearer ${this.token()}`
          }
        };
        Object.assign(defaults, props);
        return defaults;
      };
    })
    .then(done)
    .catch(err => console.error(err));
  });

  afterAll(function () {
    console.log('\nOAuth: finished');
  });

  beforeEach(function (done) {
    const authQuery = {
      client_id: this.app.id,
      redirect_uri: 'http://danielhieber.com',
      response_type: 'token',
      state: uuid.v4()
    };
    this.state = authQuery.state;
    const authPayload = { cid: this.app._rid };
    const authTokenOpts = {
      audience: 'https://api.digitallinguistics.org',
      expiresIn: 3600,
      subject: this.user._rid
    };
    const authToken = jwt.sign(authPayload, this.app.secret, authTokenOpts);
    const authOpts = {
      hostname: 'localhost',
      method: 'GET',
      path: `/auth?${qs.stringify(authQuery)}`,
      port: 3000,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    };
    const authHandler = (result, res) => {
      expect(res.statusCode).toBe(302);
      done();
    };
    makeRequest(authOpts, authHandler);
  });

  it('returns a 400 response to the DLx server if the token is not in the Auth header', function (done) {
    const handler = result => {
      expect(result.status).toBe(401);
      done();
    };
    makeRequest(this.options({ headers: {} }), handler);
  });

  it('returns a 400 response to the DLx server if the JWT ID claim is missing', function (done) {
    const token = this.token({ jwtid: undefined });
    const opts = this.options({ headers: { Authorization: `Bearer ${token}` } });
    const handler = result => {
      expect(result.status).toBe(401);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 400 response to the DLx server if the request body is ill-formed');
  // request body must have a status attribute, and either a data attribute or an error attribute

  it('returns a 401 response to the DLx server if the token is invalid', function (done) {
    const token = this.token() + 'hello';
    const opts = this.options({ headers: { Authorization: `Bearer ${token}` } });
    const handler = result => {
      expect(result.status).toBe(401);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 401 response to the DLx server if the state (jti/jwtid) is invalid');
  // each of the following should check for the state parameter in the redirect
  it('redirects to the original redirect URI with an `access_denied` if it receives one');
  it('redirects to the original redirect URI with a `server_error` response if it receives one');
  it('redirects to the original redirect URI with a `temporarily_unavailable` response if it receives one');
  it('redirects to the original redirect URI with an access token');

});
