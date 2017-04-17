/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const config = require('../lib/config');
const http   = require(`http`);
const https  = require('https');
const jwt    = require('jsonwebtoken');

const audience = `https://api.digitallinguistics.io/`;
const scope    = `public user admin openid offline_access`;

const handleError = done => function(err) {
  fail(err);
  done();
};

// The "v" parameter is a version path, e.g. "/v0", "/v1", etc.
module.exports = (req, v = ``) => {

  describe('Authentication', function() {

    it('Client Credentials', function(done) {

      const body = {
        audience,
        client_id:     config.authClientId,
        client_secret: config.authClientSecret,
        grant_type:    `client_credentials`,
      };

      const opts = {
        headers:  { 'Content-Type': `application/json` },
        hostname: config.authDomain,
        method:   `POST`,
        path:     `/oauth/token`,
      };

      const request = https.request(opts, response => {

        let data = ``;

        response.on(`data`, chunk => { data += chunk; });
        response.on(`error`, fail);
        response.on(`end`, () => {

          const tokenData = JSON.parse(data);
          const token     = tokenData.access_token;

          expect(tokenData.scope).toBe(scope);
          expect(tokenData.token_type).toBe(`Bearer`);

          const opts = {
            algorithms: [`HS256`],
            audience,
            issuer:     `https://${config.authDomain}/`,
            subject:    `${config.authClientId}@clients`,
          };

          jwt.verify(token, config.authSecret, opts, (err, payload) => {
            if (err) fail(err);
            expect(payload.scope).toBe(scope);
            config.token = token;
            done();
          });

        });

      });

      request.on(`error`, fail);
      request.end(JSON.stringify(body), `utf8`);

    });

  });

  describe('Client Registration', function() {

    xit('registers client', function(done) {

      const opts = {
        headers: { 'Content-Type': `application/json` },
        hostname: config.authDomain,
        method:  `POST`,
        path:    `/oidc/register`,
      };

      const body = {
        client_name:   `3rd Party Test Client`,
        redirect_uris: [
          `https://client.example.com/callback`,
          `https://client.example.com/callback2`,
        ],
      };

      const request = https.request(opts, response => {

        let data = ``;

        response.on(`data`, chunk => { data += chunk; });
        response.on(`error`, fail);
        response.on(`end`, () => {
          const client = JSON.parse(data);
          expect(client.client_name).toBe(body.client_name);
          done();
        });

      });

      request.on(`error`, fail);
      request.end(JSON.stringify(body), `utf8`);

    });

  });

  describe('API Errors', function() {

    it(`HTTP > HTTPS`, function(done) {

      const req = http.get(`http://api.digitallinguistics.io/test`, res => {
        let data = ``;
        res.on(`error`, fail);
        res.on(`data`, chunk => { data += chunk; });
        res.on(`end`, () => {
          expect(res.headers.location.includes('https')).toBe(true);
          done();
        });
      });

      req.on(`error`, fail);

    });

    it(`404: No Route`, function(done) {
      return req.get(`${v}/badroute`)
      .set(`Authorization`, `Bearer ${config.token}`)
      .expect(404)
      .then(done)
      .catch(handleError(done));
    });

    it('405: Method Not Allowed', function(done) {
      return req.post(`${v}/test`)
      .set('Authorization', `Bearer ${config.token}`)
      .expect(405)
      .then(done)
      .catch(handleError(done));
    });

    it('credentials_required', function(done) {
      req.get(`${v}/test`)
      .expect(401)
      .then(res => {
        expect(res.headers['www-authenticate']).toBeDefined();
        expect(res.body.error).toBe('credentials_required');
        done();
      }).catch(handleError(done));
    });

    it('GET /test', function(done) {
      req.get(`${v}/test`)
      .set('Authorization', `Bearer ${config.token}`)
      .expect(200)
      .then(res => {
        expect(res.body.message).toBe('Test successful.');
        done();
      }).catch(handleError(done));
    });

  });

};
