'use strict';

const db = require('../lib/db');
const http = require('http');
const qs = require('querystring');
const URL = require('url');
const User = require('../lib/models/user');

const handle = handler => {
  return res => {
    var data = '';
    res.on('error', err => console.error(err));
    res.on('data', chunk => data += chunk);
    res.on('end', () => handler(JSON.parse(data)));
  };
};

describe('the API', function () {

  describe('/auth', function () {

    beforeAll(function (done) {

      this.checkLoginPage = (res, done) => {
        var data = '';
        res.on('data', chunk => data += chunk);
        res.on('error', err => fail(convertResponse(err)));
        res.on('end', () => {
          expect(res.headers.location).toBeDefined();
          const url = URL.parse(res.headers.location);
          expect(url.pathname).toBe('/login');
          const q = qs.parse(url.query);
          expect(q.redirect).toBe('https://api.digitallinguistics.org/oauth');
          expect(+q.state).toEqual(this.query.raw.state);
          done();
        });
      };

      this.app = { id: '12345', description: 'Test app.' };
      this.user = { id: 'me@example.com', firstName: 'Danny', lastName: 'Hieber' };

      const task = () => db.create('apps', this.app).then(app => {
        this.app = app;

        this.query = (() => {

          const defaults = {
            client_id: this.app.id,
            redirect_uri: 'http://danielhieber.com',
            response_type: 'token',
            state: 12345,
          };

          const func = props => {
            const params = {};
            Object.assign(params, defaults, props);
            return qs.stringify(params);
          };

          Object.defineProperty(func, 'raw', {
            get: () => {
              const params = {};
              Object.assign(params, defaults);
              return params;
            }
          });

          return func;

        })();

      }).then(() => db.upsert('users', this.user))
      .then(user => {
        this.user = new User(user);
        this.user.updateToken();

        this.options = (props) => {
          props = props || {};
          const defaults = {
            hostname: 'localhost',
            path: `/auth?${this.query()}`,
            port: 3000,
            headers: {
              'Authorization': `Bearer ${this.user.dlxToken}`
            }
          };
          Object.assign(defaults, props);
          return defaults;
        };

      }).then(done)
      .catch(err => {
        if (err.status == 409) { this.app.id = ((+this.app.id) + 1) + ''; task(); }
        else { console.error(err); }
      });

      task();

    });

    afterAll(function (done) {
      db.delete('apps', this.app._rid).then(res => {
        if (res.status !== 204) { console.error(res); }
        done();
      }).catch(err => console.error(err));
    });

    xit('returns a 404 response if the method is not GET', function (done) {
      const handler = data => {
        expect(data.status).toEqual(404);
        done();
      };
      const opts = this.options({ method: 'POST' });
      http.request(opts, handle(handler)).end();
    });

    xit('returns a 400 response when missing the `client_id` parameter', function (done) {
      const handler = data => {
        expect(data.status).toEqual(400);
        expect(data.error_description.includes('client_id')).toBe(true);
        done();
      };
      const q = this.query.raw;
      delete q.client_id;
      const opts = this.options({ path: `/auth?${qs.stringify(q)}` });
      http.request(opts, handle(handler)).end();
    });

    xit('returns a 400 response when missing the `redirect_uri` parameter', function (done) {
      const handler = data => {
        expect(data.status).toEqual(400);
        expect(data.error_description.includes('redirect_uri')).toBe(true);
        done();
      };
      const opts = this.options({ path: `/auth?${this.query({ redirect_uri: undefined })}` });
      http.request(opts, handle(handler)).end();
    });

    xit('returns a 400 response when missing the `response_type` parameter', function (done) {
      const handler = data => {
        expect(data.status).toEqual(400);
        expect(data.error_description.includes('response_type')).toBe(true);
        done();
      };
      const opts = this.options({ path: `/auth?${this.query({ response_type: null })}` });
      http.request(opts, handle(handler)).end();
    });

    xit('returns a 400 response when the `response_type` parameter is not `token`', function (done) {
      const handler = data => {
        expect(data.status).toEqual(400);
        expect(data.error_description.includes('response_type')).toBe(true);
        done();
      };
      const opts = this.options({ path: `/auth?${this.query({ response_type: 'code' })}`});
      http.request(opts, handle(handler)).end();
    });

    xit('returns an error if the client app is not registered/found', function (done) {
      const handler = data => {
        expect(data.status).toEqual(404);
        done();
      };
      const q = this.query.raw;
      q.client_id += '2';
      const opts = this.options({ path: `/auth?${qs.stringify(q)}` });
      http.request(opts, handle(handler)).end();
    });

    xit('renders the login page if the DLx cookie is missing', function (done) {
      // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
      const opts = this.options({ headers: {} });
      http.request(opts, res => this.checkLoginPage(res, done)).end();
    });

    xit('returns an error if the DLx cookie is invalid', function (done) {
      // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
      const handler = data => {
        expect(data.status).toEqual(401);
        done();
      };
      const token = this.user.dlxToken + 'hello';
      const opts = this.options({ headers: { Authorization: `Bearer ${token}` } });
      http.request(opts, handle(handler)).end();
    });

    it('renders the login page if the DLx cookie is expired');
    // this test uses the DLx token in the authorization header as a proxy for the dlx cookie

    xit('renders the login page if the DLx cookie is present but the user is not logged in to DLx', function (done) {
      // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
    });

    xit('returns a DLx token if the user is logged in and the token is not expired', function (done) {
      // TODO: create a temporary user
      // TODO: the state parameter should be included in the response querystring
      // TODO: the DLx token should be included in the response querystring
      done();
    });

  });

  describe('/apps', function () {
    it('returns a 405 response if Basic auth is absent');
    it('returns a 401 response if Basic auth is present but invalid');
  });

  describe('/users', function () {
    it('returns a 405 response for non-POST requests with Bearer tokens');
  });

  describe('/{collection}/{itemId}', function () {
    it('returns a 404 response if the collection does not exist'); // use next() inside the handler for this
  });

  describe('/{collection}', function () {
    it('returns a 404 response if the collection does not exist'); // use next() inside the handler for this
    it('redirects `/v1/auth` to `/auth`');
  });

});
