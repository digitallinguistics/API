const ClientApp = require('../lib/models/client-app');
const db = require('../lib/db');
const http = require('http');
const jwt = require('jsonwebtoken');
const qs = require('querystring');
const URL = require('url');
const User = require('../lib/models/user');
const uuid = require('uuid');

describe('/auth', function () {

  const makeRequest = (opts, handler) => {
    http.request(opts, res => {
      var data = '';
      res.on('data', chunk => data += chunk);
      res.on('error', err => fail(err));
      res.on('end', () => {
        const result = data.startsWith('{') ? JSON.parse(data) : data;
        if (res.statusCode == 302) {
          const hash = qs.parse(URL.parse(res.headers.location).hash.replace('#', ''));
          expect(hash.state).toBeDefined();
          const errors = [
            'invalid_request',
            'unauthorized_client',
            'access_denied',
            'unsupported_response_type',
            'invalid_scope',
            'server_error',
            'temporarily_unavailable'
          ];
          if (hash.error) { expect(errors).toContain(hash.error); }
        }
        handler(result, res);
      });
    }).end();
  };

  beforeAll(function (done) {
    console.log('Auth: starting');
    db.upsert('apps', new ClientApp({ name: 'Auth Test App' })).then(app => {
      this.app = new ClientApp(app);
      this.query = props => {
        const defaults = {
          client_id: this.app.id,
          redirect_uri: 'http://danielhieber.com',
          response_type: 'token',
          state: uuid.v4()
        };
        Object.assign(defaults, props || {});
        return defaults;
      };
      this.token = (payload, opts) => {
        const defaultPayload = { cid: this.app._rid };
        const defaultOpts = {
          algorithm: 'HS256',
          audience: 'https://api.digitallinguistics.org',
          expiresIn: 3600,
          subject: this.user._rid
        };
        Object.assign(defaultPayload, payload || {});
        Object.assign(defaultOpts, opts || {});
        return jwt.sign(defaultPayload, this.app.secret, defaultOpts);
      };
      this.options = props => {
        const defaults = {
          hostname: 'localhost',
          method: 'GET',
          path: `/auth?${qs.stringify(this.query())}`,
          port: 3000,
          headers: {
            Authorization: `Bearer ${this.token()}`
          }
        };
        Object.assign(defaults, props || {});
        return defaults;
      };
      return;
    }).then(() => db.upsert('users', new User({ firstName: 'Auth', lastName: 'Test User' })))
    .then(user => this.user = user)
    .then(done)
    .catch(err => console.error(err));
  });

  afterAll(function () {
    console.log('\nAuth: finished');
  });

  xit('returns a 400 response if the `client_id` parameter is missing', function (done) {
    const qstring = qs.stringify(this.query({ client_id: undefined }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(400);
      expect(result.error).toBe('invalid_request');
      expect(result.error_description.includes('client_id')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  xit('returns a 400 response if the `redirect_uri` parameter is missing', function (done) {
    const qstring = qs.stringify(this.query({ redirect_uri: undefined }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(400);
      expect(result.error_description.includes('redirect_uri')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 400 response if the `redirect_uri` parameter does not match the registered one');

  it('returns a 400 response if the `response_type` parameter is missing.');

  xit('returns a 400 response if the `response_type` parameter is not `token`', function (done) {
    const qstring = qs.stringify(this.query({ response_type: 'code' }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(400);
      expect(result.error).toBe('unsupported_response_type');
      expect(result.error_description.includes('response_type')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  xit('returns a 401 response if the `client_id` is invalid', function (done) {
    const qstring = qs.stringify(this.query({ client_id: 'badId' }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(401);
      expect(result.error).toBe('unauthorized_client');
      expect(result.error_description.includes('client')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  // if no token is provided in the Auth or Cookie headers, user is assumed to not be logged in
  xit('redirects to the login page if the user is not logged in', function (done) {
    const q = this.query();
    const state = q.state;
    const opts = this.options({ path: `/auth?${qs.stringify(q)}`, headers: {} });
    const handler = (result, res) => {
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBeDefined();
      const url = URL.parse(res.headers.location);
      expect(url.pathname).toEqual('/login');
      expect(url.hostname).toEqual('digitallinguistics.org');
      const query = qs.parse(url.query);
      expect(query.redirect).toBe('https://api.digitallinguistics.org/oauth');
      expect(query.state).toEqual(state);
      done();
    };
    makeRequest(opts, handler);
  });

  xit('redirects to the login page if the User ID in the token is invalid', function (done) {
    const token = this.token({}, { subject: 'badId' });
    const opts = this.options({ headers: { Authorization: `Bearer ${token}` }});
    const handler = (result, res) => {
      const url = URL.parse(res.headers.location);
      expect(url.pathname).toEqual('/login');
      expect(url.hostname).toEqual('digitallinguistics.org');
      done();
    };
    makeRequest(opts, handler);
  });

  it('redirects to the redirect URI with a valid OAuth response if the token is valid', function (done) {
    const q = this.query();
    const state = q.state;
    const opts = this.options({ path: `/auth?${qs.stringify(q)}` });
    const handler = (result, res) => {
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBeDefined();
      const url = URL.parse(res.headers.location);
      expect(url.hostname).toBe('danielhieber.com');
      const hash = qs.parse(url.hash.replace('#', ''));
      expect(hash.state).toEqual(state);
      expect(hash.access_token).toBeDefined();
      expect(hash.expires_in).toBe(3600);
      const opts = {
        algorithms: ['HS256'],
        audience: 'https://api.digitallinguistics.org',
        subject: this.user._rid
      };
      const payload = jwt.verify(hash.access_token, this.app.secret, opts);
      expect(payload.cid).toEqual(this.app._rid);
      done();
    };
    makeRequest(opts, handler);
  });

});
