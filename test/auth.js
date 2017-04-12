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

    describe('Authorization Endpoint', function() {

      const parameters = {
        client_id:     config.cid,
        redirect_uri:  `${config.baseUrl}/oauth`,
        response_type: 'code',
        state:         '12345',
      };

      xit('unsupported_response_type', function(done) {
        const params = Object.assign({}, parameters, { response_type: 'bad' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('unsupported_response_type'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_scope', function(done) {
        const params = Object.assign({}, parameters, { scope: 'bad' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_scope'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_scope: public', function(done) {
        const params = Object.assign({}, parameters, { scope: 'public' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_scope'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_request: bad client param', function(done) {
        const params = Object.assign({}, parameters, { client_id: '' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_request'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_request: bad redirect param', function(done) {
        const params = Object.assign({}, parameters, { redirect_uri: '' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_request'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_request: bad redirect URI', function(done) {
        const params = Object.assign({}, parameters, { redirect_uri: 'http://localhost:3000/test' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_request'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_request: bad client ID', function(done) {
        const params = Object.assign({}, parameters, { client_id: '12345' });
        return req.get(`/auth?${qs.stringify(params)}`)
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_request'))
        .then(done)
        .catch(handleError(done));
      });

      xit('success', function(done) {
        return req.get(`/auth?${qs.stringify(parameters)}`)
        .expect(302)
        .then(res => expect(res.headers.location.startsWith('https://digitallinguistics.auth0.com/')).toBe(true))
        .then(done)
        .catch(handleError(done));
      });

    });

    describe('Token Endpoint', function() {

      const codeParams = {
        code:         '12345',
        grant_type:   'authorization_code',
        redirect_uri: `${config.baseUrl}/oauth`,
      };

      xit('unsupported_grant_type', function(done) {
        return req.post(`/token`)
        .send(Object.assign({}, codeParams, { grant_type: '' }))
        .expect(400)
        .then(res => expect(res.body.error).toBe('unsupported_grant_type'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_grant: bad code', function(done) {
        return req.post('/token')
        .send(Object.assign({}, codeParams, { code: '' }))
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_grant'))
        .then(done)
        .catch(handleError(done));
      });

      xit('invalid_request: bad redirect', function(done) {
        return req.post('/token')
        .send(Object.assign({}, codeParams, { redirect_uri: '' }))
        .expect(400)
        .then(res => expect(res.body.error).toBe('invalid_request'))
        .then(done)
        .catch(handleError(done));
      });

      it('invalid_scope', function(done) {
        return req.post('/token')
        .send({
          grant_type: 'client_credentials',
        })


      });

    });

  });

};
