/* eslint-disable
  camelcase,
  func-names,
  max-nested-callbacks,
  newline-per-chained-call,
  prefer-arrow-callback
*/

const client = require('./client');
const config = require('../lib/config');
const db     = require('../lib/db');
const qs     = require('querystring');

const handleError = done => function(err) {
  fail(err);
  done();
};

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = '') => {

  describe('OAuth 2.0', function() {

    beforeAll(function(done) {
      db.upsert(client).then(done).catch(fail);
    });

    describe('Authorization Code Grant', function() {

      const parameters = {
        client_id:     config.cid,
        redirect_uri:  `${config.baseUrl}/oauth`,
        response_type: 'code',
        state:         '12345',
      };

      it('unsupported_response_type', function(done) {
        const params = Object.assign({}, parameters, { response_type: 'bad' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => {
          expect(res.body.error).toBe('unsupported_response_type');
          done();
        }).catch(handleError(done));
      });

      it('invalid_scope', function(done) {
        const params = Object.assign({}, parameters, { scope: 'bad' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => {
          expect(res.body.error).toBe('invalid_scope');
          done();
        }).catch(handleError(done));
      });

      it('invalid_scope: public', function(done) {
        const params = Object.assign({}, parameters, { scope: 'public' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => {
          expect(res.body.error).toBe('invalid_scope');
          done();
        }).catch(handleError(done));
      });

      it('invalid_request: bad client param', function(done) {
        const params = Object.assign({}, parameters, { client_id: '' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => {
          expect(res.body.error).toBe('invalid_request');
          done();
        }).catch(handleError(done));
      });

      it('invalid_request: bad redirect param', function(done) {
        const params = Object.assign({}, parameters, { redirect_uri: '' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => {
          expect(res.body.error).toBe('invalid_request');
          done();
        }).catch(handleError(done));
      });

      it('invalid_request: bad client ID', function(done) {
        const params = Object.assign({}, parameters, { client_id: '12345' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => {
          expect(res.body.error).toBe('invalid_request');
          done();
        }).catch(handleError(done));
      });

      it('success', function(done) {
        return req.get(`/auth?${qs.stringify(parameters)}`)
        .expect(302)
        .then(res => expect(res.headers.location.startsWith('https://digitallinguistics.auth0.com/')).toBe(true))
        .then(done)
        .catch(handleError(done));
      });

    });

    describe('OAuth Callback', function() {

      const parameters = {
        code:  'OtnroUrBTI_ppf5m',
        state: 'c315179d-a465-5af5-6e8e-223d302fda87',
      };

      it('server_error: could not retrieve authReq', function(done) {
        return req.get(`/oauth?${qs.stringify(parameters)}`)
        .then(res => {
          expect(res.body.code).toBe('invalid_grant');
          done();
        }).catch(handleError(done));
      });

      xit('access_denied', function() {
        pending(`This error won't occur, because Passport returns a 401 Unauthorized first.`);
      });

      xit('other error from authentication provider', function() {
        pending(`This error won't occur, because Passport returns a 401 Unauthorized first.`);
      });

    });

  });

};
