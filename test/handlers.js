/* eslint-disable camelcase */

const config = require(`../lib/config`);
const https  = require(`https`);
const qs     = require(`querystring`);

const audience      = `https://api.digitallinguistics.io/`;
const authURL       = `https://${config.authDomain}`;
const client_id     = config.authClientID;
const client_secret = config.authClientSecret;
const redirect_uri  = `${config.baseURL}/test/callback`;
const state         = `12345`;

const callback = (req, res) => {

  if (req.query.code) {

    const body = {
      audience,
      client_id,
      client_secret,
      code:          req.query.code,
      grant_type:    `authorization_code`,
      redirect_uri,
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
      response.on(`error`, err => res.send(err.message));
      response.on(`end`, () => { res.json(JSON.parse(data)); });
    });

    request.on(`error`, err => res.send(err.message));
    request.end(JSON.stringify(body), `utf8`);

  } else {

    res.json(req.query);

  }

};

// TODO: implement endpoint for client grant test (even though you already have a test for it)

const code = (req, res) => {

  const params = {
    audience,
    client_id,
    redirect_uri,
    response_type: `code`,
    scope:         `offline_access openid`,
    state,
  };

  res.redirect(`${authURL}/authorize?${qs.stringify(params)}`);

};

const implicit = (req, res) => {

  const params = {
    audience,
    client_id,
    nonce:         `abcde`,
    redirect_uri,
    response_type: `token`,
    scope:         `openid`,
    state,
  };

  res.redirect(`${authURL}/authorize?${qs.stringify(params)}`);

};

const main = (req, res) => {
  res.status(200);
  res.json({
    message: `Test successful.`,
    status:   200,
  });
};

module.exports = {
  callback,
  code,
  implicit,
  main,
};
