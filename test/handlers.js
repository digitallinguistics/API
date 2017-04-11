const config = require('../lib/config');
const http   = require('http');
const qs     = require('querystring');

const callback = (req, res) => {

  if (req.query.code) {

    // TODO: exchange code for access token

  } else {

    res.json(req.query);

  }

};

const client = (req, res) => {};

const code = (req, res) => {

  const params = {
    client_id:     config.cid,
    redirect_uri:  `${config.baseUrl}/test/callback`,
    response_type: 'code',
    state:         '12345',
  };

  const request = http.get(`${config.baseUrl}/auth?${qs.stringify(params)}`, response => {
    let data = '';
    response.on('error', err => res.send(err.message));
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => res.redirect(response.headers.location));
  });

  request.on('error', err => res.send(err.message));

};

const implicit = (req, res) => {

  const params = {
    client_id:     config.cid,
    redirect_uri:  `${config.baseUrl}/test/callback`,
    response_type: 'token',
    scope:         'user',
    state:         'abcde',
  };

  const request = http.get(`${config.baseUrl}/auth?${qs.stringify(params)}`, response => {
    let data = '';
    response.on('error', err => res.send(err.message));
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => res.redirect(response.headers.location));
  });

  request.on('error', err => res.send(err.message));

};

const main = (req, res) => {
  res.status(200);
  res.json({
    message: 'Test successful.',
    status:   200,
  });
};

module.exports = {
  callback,
  client,
  code,
  implicit,
  main,
};
