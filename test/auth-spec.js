const ClientApp = require('../lib/models/client-app');
const db = require('../lib/db');
const http = require('http');
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
        handler(result, res);
      });
    }).end();
  };

  beforeAll(function (done) {
    console.log('Auth: starting');
    db.upsert('apps', { name: 'Auth Test App' }).then(app => {
      this.app = new ClientApp(app);
      this.query = props => {
        const defaults = {
          client_id: this.app.id,
          redirect_uri: 'http://danielhieber.com',
          response_type: 'token',
          state: uuid.v4()
        };
        Object.assign(defaults, props);
        return defaults;
      };
      this.options = props => {
        const defaults = {
          hostname: 'localhost',
          method: 'GET',
          path: `/auth?${qs.stringify(this.query())}`,
          port: 3000
        };
        Object.assign(defaults, props);
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

  it('returns a 400 response if the `client_id` parameter is missing', function (done) {
    const qstring = qs.stringify(this.query({ client_id: undefined }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(400);
      expect(result.error_description.includes('client_id')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 400 response if the `redirect_uri` parameter is missing', function (done) {
    const qstring = qs.stringify(this.query({ redirect_uri: undefined }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(400);
      expect(result.error_description.includes('redirect_uri')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 400 response if the `response_type` parameter is not `token`', function (done) {
    const qstring = qs.stringify(this.query({ response_type: 'code' }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(400);
      expect(result.error_description.includes('response_type')).toBe(true);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 404 response if the application ID is invalid', function (done) {
    const qstring = qs.stringify(this.query({ client_id: 'badId' }));
    const opts = this.options({ path: `/auth?${qstring}` });
    const handler = result => {
      expect(result.status).toBe(404);
      done();
    };
    makeRequest(opts, handler);
  });

  // if no token is provided in the Auth or Cookie headers, user is assumed
  it('redirects to the login page if the user is not logged in', function (done) {
    const q = this.query();
    const state = q.state;
    const opts = this.options({ path: `/auth?${qs.stringify(q)}` });
    const handler = (result, res) => {
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


});
