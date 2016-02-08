const credentials = require('../lib/credentials');
const db = require('../lib/db');
const http = require('http');

describe('/apps', function () {

  const options = props => {
    props = props || {};
    const defaults = {
      // TODO: replace this auth header with a JWT Bearer token
      auth: `${credentials.user}:${credentials.secret}`,
      hostname: 'localhost',
      path: '/v1/apps',
      port: 3000
    };
    Object.assign(defaults, props);
    return defaults;
  };

  const makeRequest = (opts, handler) => {
    http.request(opts, res => {
      var data = '';
      res.on('data', chunk => data += chunk);
      res.on('err', err => fail(err));
      res.on('end', () => {
        handler(JSON.parse(data));
      });
    }).end();
  };

  beforeAll(function (done) {
    console.log('Apps: starting');

    this.app = { id: 'dlx', description: 'DLx test app.', permissions: { owner: [], contributor: [], viewer: [], public: false } };

    db.create('apps', this.app)
    .then(app => {
      console.log('Apps: test app created');
      this.app = app;
      done();
    }).catch(err => fail(err));
  });

  afterAll(function (done) {

    db.delete('apps', this.app._rid)
    .then(res => {
      if (res.status == 204) { console.log('\nApps: test app deleted'); }
      else { console.error('\nApps: problem deleting test app'); }
      console.log('Apps: finished');
      done();
    }).catch(err => console.error('\nApps: problem deleting test app:', err));

  });

  it('returns a 405 response if Basic auth is absent', function (done) {
    const opts = options({ auth: undefined });
    const handler = data => {
      expect(data.status).toEqual(405);
      done();
    };
    makeRequest(opts, handler);
  });

  it('returns a 401 response if Basic auth is present but invalid');
  it('returns a 404 response if the app is not found');
  it('can upsert apps');
  it('returns an error if the app to be upserted does not validate');
  it('can delete apps');
  it('can get apps');
  it('can register a new app');
  it('returns an error if the new app information does not validate');
  it('can add permissions to an app');
  it('can remove permissions from an app');

});
