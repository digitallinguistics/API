/* eslint-disable
  camelcase,
  func-names,
  newline-per-chained-call,
  prefer-arrow-callback
*/

const config = require('../lib/config');
const db     = require('../lib/db');
const qs     = require('querystring');

const clientApp = {
  confidential: true,
  id:           config.cid,
  name:        'API Test App',
  permissions: {
    contributor: [],
    owner:       [],
    public:      false,
    viewer:      [],
  },
  redirects:   ['http://localhost:3000/oauth'],
  scope:       'public',
  secret:       config.secret,
  type:        'client-app',
};

const handleError = done => function(err) {
  fail(err);
  done();
};

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = '') => {

  describe('OAuth 2.0', function() {

    beforeAll(function(done) {
      db.upsert(clientApp).then(done).catch(fail);
    });

    it('Authorization Code', function(done) {

      const params = {
        client_id:     config.cid,
        redirect_uri:  'http://localhost:3000/oauth',
        response_type: 'code',
        state:         '12345',
      };

      return req.get(`/auth?${qs.stringify(params)}`)
      .expect(302)
      .then(res => expect(res.headers.location.startsWith('https://digitallinguistics.auth0.com/')).toBe(true))
      .then(done)
      .catch(handleError(done));

    });

  });

};
