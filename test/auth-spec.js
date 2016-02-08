'use strict';

const ClientApp = require('../lib/models/client-app');
const credentials = require('../lib/credentials');
const db = require('../lib/db');
const http = require('http');
const jwt = require('jsonwebtoken');
const qs = require('querystring');
const URL = require('url');

const makeRequest = (opts, handler) => {
  http.request(opts, res => {
    var data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => handler(JSON.parse(data)));
    res.on('error', err => fail(err));
  }).end();
};

describe('/auth', function () {

  beforeAll(function (done) {

    console.log('Auth: starting');

    this.checkLoginPage = opts => new Promise((resolve, reject) => {
      http.request(opts, res => {
        var data = '';
        res.on('data', chunk => data += chunk);
        res.on('error', err => {
          fail(err);
          err = JSON.parse(err);
          reject(err);
        });
        res.on('end', () => {
          if (!res.headers.location) {
            fail(data);
            const err = JSON.parse(data);
            reject(err);
          } else {
            const url = URL.parse(res.headers.location);
            expect(url.pathname).toBe('/login');
            const q = qs.parse(url.query);
            expect(q.redirect).toBe('https://api.digitallinguistics.org/oauth');
            expect(+q.state).toEqual(this.query.raw.state);
            resolve();
          }
        });
      }).end();
    });

    this.app = new ClientApp({ name: 'TestApp' });
    this.user = { id: 'danny@danielhieber.com', firstName: 'Danny', lastName: 'Hieber' };

    const task = () => db.create('apps', this.app).then(app => {

      console.log('Auth: test app created');

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

      return;

    }).then(() => db.upsert('users', this.user))
    .then(user => {

      console.log('Auth: test user created.');

      this.user = user;

      this.tokenPayload = {
        cid: this.app._rid,
        scope: 'user'
      };

      this.tokenOpts = {
        algorithm: 'HS256',
        audience: 'https://api.digitallinguistics.org',
        expiresIn: 3600,
        subject: this.user._rid
      };

      const token = jwt.sign(this.tokenPayload, this.app.secret, this.tokenOpts);

      this.options = props => {
        props = props || {};
        const defaults = {
          hostname: 'localhost',
          path: `/auth?${this.query()}`,
          port: 3000,
          headers: { 'Authorization': `Bearer ${token}` }
        };
        Object.assign(defaults, props);
        return defaults;
      };

    }).then(done).catch(err => console.error(err));

    task();

  }, 10000);

  afterAll(function (done) {
    db.delete('apps', this.app._rid).then(res => {
      if (res.status !== 204) { console.error(res); }
      console.log('Auth: finished');
      done();
    }).catch(err => {
      fail(err);
      console.log('Auth: finished');
      done();
    });
  });

  it('returns a 404 response if the method is not GET', function (done) {
    const handler = data => {
      expect(data.status).toEqual(404);
      done();
    };
    const opts = this.options({ method: 'POST' });
    makeRequest(opts, handler);
  });

  it('returns a 400 response when missing the `client_id` parameter', function (done) {
    const handler = data => {
      expect(data.status).toEqual(400);
      expect(data.error_description.includes('client_id')).toBe(true);
      done();
    };
    const q = this.query.raw;
    delete q.client_id;
    const opts = this.options({ path: `/auth?${qs.stringify(q)}` });
    makeRequest(opts, handler);
  });

  it('returns a 400 response when missing the `redirect_uri` parameter', function (done) {
    const handler = data => {
      expect(data.status).toEqual(400);
      expect(data.error_description.includes('redirect_uri')).toBe(true);
      done();
    };
    const opts = this.options({ path: `/auth?${this.query({ redirect_uri: undefined })}` });
    makeRequest(opts, handler);
  });

  it('returns a 400 response when missing the `response_type` parameter', function (done) {
    const handler = data => {
      expect(data.status).toEqual(400);
      expect(data.error_description.includes('response_type')).toBe(true);
      done();
    };
    const opts = this.options({ path: `/auth?${this.query({ response_type: null })}` });
    makeRequest(opts, handler);
  });

  it('returns a 400 response when the `response_type` parameter is not `token`', function (done) {
    const handler = data => {
      expect(data.status).toEqual(400);
      expect(data.error_description.includes('response_type')).toBe(true);
      done();
    };
    const opts = this.options({ path: `/auth?${this.query({ response_type: 'code' })}`});
    makeRequest(opts, handler);
  });

  it('returns an error if the client app is not registered/found', function (done) {
    const handler = data => {
      expect(data.status).toEqual(404);
      done();
    };
    const q = this.query.raw;
    q.client_id += '2';
    const opts = this.options({ path: `/auth?${qs.stringify(q)}` });
    makeRequest(opts, handler);
  });

  // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
  it('renders the login page if the DLx cookie is missing', function (done) {
    const opts = this.options({ headers: {} });
    this.checkLoginPage(opts).then(done).catch(err => fail(err));
  });

  // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
  it('returns an error if the DLx cookie is invalid', function (done) {
    const handler = data => {
      expect(data.status).toEqual(401);
      done();
    };
    const token = 'hello';
    const opts = this.options({ headers: { Authorization: `Bearer ${token}` } });
    makeRequest(opts, handler);
  });

  // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
  it('renders the login page if the DLx cookie is expired', function (done) {
    const tokenOpts = {};
    Object.assign(tokenOpts, this.tokenOpts);
    tokenOpts.expiresIn = 0;
    const token = jwt.sign(this.tokenPayload, this.app.secret, tokenOpts);
    const opts = this.options({ headers: { Authorization: `Bearer ${token}` } });
    this.checkLoginPage(opts).then(done).catch(err => fail(err));
  });

  // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
  it('renders the login page if the DLx cookie is present but the user is not logged in to DLx', function (done) {
    this.user.lastActive = 1;
    db.upsert('users', this.user)
    .then(() => {
      const opts = this.options();
      this.checkLoginPage(opts).then(done).catch(err => fail(err));
    }).catch(err => fail(err));
  });

  it('returns a DLx token if the user is logged in and the token is not expired', function (done) {
    this.user.lastActive = Date.now();
    db.upsert('users', this.user)
    .then(() => {
      const opts = this.options();
      http.request(opts, res => {
        var data = '';
        res.on('error', err => fail(err));
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (!res.headers.location) {
            const err = JSON.parse(data);
            if (err.status == 500) { fail(err); }
          } else {
            const url = URL.parse(res.headers.location);
            const query = qs.parse(url.query);
            expect(+query.state).toEqual(this.query.raw.state);
            expect(typeof query.access_token).toBe('string');
            const opts = {
              algorithms: ['HS256'],
              audience: 'https://api.digitallinguistics.org',
              subject: this.user._rid
            };
            jwt.verify(query.access_token, this.app.secret, opts, (err, payload) => {
              expect(err).toBeNull();
              if (payload) {
                expect(payload.cid).toEqual(this.app._rid);
              }
              done();
            });
          }
        });
      }).end();
    }).catch(err => fail(err));
  });

  it('handles OAuth responses'); // mock the sending of an OAuth response

});
