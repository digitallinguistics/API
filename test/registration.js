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
const req    = require('superagent');

const { testAsync } = require('./utilities');

describe(`Client Registration`, function() {

  xit(`registers client`, testAsync(async function() {

    pending(`This test registers a client, and should only be run when needed.`);

    const body = {
      client_name:   `3rd Party Test Client`,
      redirect_uris: [
        `https://client.example.com/callback`,
        `https://client.example.com/callback2`,
      ],
    };

    const res = await req.post(`https://${config.authDomain}/oidc/register`)
    .type(`application/json`)
    .send(body);

    const client = res.body;
    expect(client.client_name).toBe(body.client_name);

  }));

});
