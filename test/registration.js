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
