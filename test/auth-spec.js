const ClientApp = require('../lib/models/client-app');
const db = require('../lib/db');
const http = require('http');
const qs = require('querystring');
const uuid = require('uuid');

describe('/auth', function () {

  const makeRequest = (opts, handler) => {
    http.request(opts, res => {
      var data = '';
      res.on('data', chunk => data += chunk);
      res.on('error', err => fail(err));
      res.on('end', () => handler(JSON.parse(data), res));
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
      done();
    }).catch(err => console.error(err));
  });

  afterAll(function () {
    console.log('Auth: finished');
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


});
