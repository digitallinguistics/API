'use strict';

const credentials = require('../lib/credentials');
const db = require('../lib/db');
const http = require('http');
const jwt = require('jsonwebtoken');
const qs = require('querystring');
const URL = require('url');
const User = require('../lib/models/user');

const makeRequest = (opts, handler) => {
  http.request(opts, res => {
    var data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => handler(JSON.parse(data)));
    res.on('error', err => fail(err));
  }).end();
};

describe('/auth', function () {

  console.log('Starting auth spec.');

  beforeAll(function (done) {

    this.checkLoginPage = opts => new Promise((resolve, reject) => {
      const task = () => {
        http.request(opts, res => {
          var data = '';
          res.on('data', chunk => data += chunk);
          res.on('error', err => {
            err = JSON.parse(err);
            fail(err); reject(err);
          });
          res.on('end', () => {
            if (!res.headers.location) {
              const err = JSON.parse(data);
              fail(err); reject(err);
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
      };
      task();
    });

    this.app = { id: '12345', name: 'Test app.' };
    this.user = { id: 'danny@danielhieber.com', firstName: 'Danny', lastName: 'Hieber' };

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

      return;

    }).then(() => db.upsert('users', this.user))
    .then(user => {
      this.user = new User(user);
      // TODO: create new user token here and pass it to the Authorization header below

      this.options = props => {
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
      else if (err.status == 429) { setTimeout(task, 500); }
      else { console.error(err); }
    });

    task();

  }, 10000);

  afterAll(function (done) {
    const task = () => db.delete('apps', this.app._rid).then(res => {
      if (res.status !== 204) { console.error(res); }
      console.log('Auth spec finished.');
      done();
    }).catch(err => {
      if (err.status == 429) { setTimeout(task, 500); }
      else { fail(err); }
      console.log('Auth spec finished.');
      done();
    });
    task();
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
    const token = this.user.dlxToken + 'hello';
    const opts = this.options({ headers: { Authorization: `Bearer ${token}` } });
    makeRequest(opts, handler);
  });

  // this test uses the DLx token in the authorization header as a proxy for the dlx cookie
  it('renders the login page if the DLx cookie is expired', function (done) {
    const payload = { rid: this.user.rid };
    const token = jwt.sign(payload, credentials.secret, { expiresIn: 0 });
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
            jwt.verify(query.access_token, credentials.secret, (err, payload) => {
              expect(err).toBeNull();
              expect(payload.rid).toEqual(this.user.rid);
              done();
            });
          }
        });
      }).end();
    }).catch(err => fail(err));
  });

  it('handles OAuth responses'); // mock the sending of an OAuth response

});
