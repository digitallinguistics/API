/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const config        = require('../lib/config');
const req           = require('superagent');
const testAsync     = require('./async');
const { verifyJwt } = require('./jwt');

const audience = `https://api.digitallinguistics.io/`;
const scope    = `public user admin openid offline_access`;

describe('Authentication', function() {

  it('Client Credentials', testAsync(async function() {

    const body = {
      audience,
      client_id:     config.authClientId,
      client_secret: config.authClientSecret,
      grant_type:    `client_credentials`,
    };

    const url = `https://${config.authDomain}/oauth/token`;

    const res = await req.post(url)
    .type(`application/json`)
    .send(body);

    const token = res.body.access_token;

    expect(res.body.scope).toBe(scope);
    expect(res.body.token_type).toBe(`Bearer`);

    const opts = {
      algorithms: [`HS256`],
      audience,
      issuer:     `https://${config.authDomain}/`,
      subject:    `${config.authClientId}@clients`,
    };

    const payload = await verifyJwt(token, config.authSecret, opts);

    expect(payload.scope).toBe(scope);

  }));

});
