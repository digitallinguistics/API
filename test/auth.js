/* eslint-disable
  camelcase,
  func-names,
  newline-per-chained-call,
  prefer-arrow-callback
*/

const config = require('../lib/config');
const qs     = require('querystring');

const handleError = done => function(err) {
  fail(err);
  done();
};

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = '') => {

  describe('OAuth 2.0', function() {

    it('Authorization Code', function(done) {

      const params = {
        client_id:     config.cid,
        redirect_uri:  'http://localhost:3000/oauth',
        response_type: 'code',
        state:         '12345',
      };

      return req.get(`/auth?${qs.stringify(params)}`)
      .expect(302)
      .then(res => {
        console.log(res.headers);
        console.log(res.body);
      }).then(done)
      .catch(handleError(done));

    });

  });

};
