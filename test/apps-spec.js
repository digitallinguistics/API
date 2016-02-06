const credentials = require('../lib/credentials');
const db = require('../lib/db');
const http = require('http');

describe('/apps', function () {

  const options = props => {
    props = props || {};
    const defaults = {
      auth: 'dlx-org:' + credentials.secret,
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

    this.app = { id: 'dlx', description: 'DLx test app.', permissions: { owner: [], contributor: [], viewer: [], public: false } };

    db.create('apps', this.app)
    .then(app => {
      this.app = app;
      done();
    }).catch(err => fail(err));
  });

  afterAll(function (done) {

    db.delete('apps', this.app._rid)
    .then(res => {
      if (res.status == 204) { console.log('\nTest app deleted.'); }
      else { console.error('\nProblem deleting test app.'); }
      done();
    }).catch(err => console.error('\n Problem deleting test app:', err));

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
  it('can delete apps');
  it('can get apps');
  it('can register a new app');
  it('can add permissions to an app');
  it('can remove permissions from an app');

});
