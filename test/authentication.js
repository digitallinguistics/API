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
const https  = require('https');
const jwt    = require('jsonwebtoken');

const audience = `https://api.digitallinguistics.io/`;
const scope    = `public user admin openid offline_access`;

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
          done();
        });

      });

    });

    request.on(`error`, fail);
    request.end(JSON.stringify(body), `utf8`);

  });

});
