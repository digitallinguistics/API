var config = require('./config');
var credentials = require('./credentials');
var db = require('./db');
var https = require('https');
var qs = require('querystring');
var uuid = require('uuid');

const authRequests = [];

exports.grant = function (req, res) {
  res.render('test', { test: 'Implicit Grant' });
};

exports.login = function (req, res) {

  var getAuthUrl = function (service, redirect) {

    const time = new Date();
    const state = uuid.v4();

    const query = {
      client_id: credentials.services[service].clientId,
      response_type: 'code',
      redirect_uri: config.mapUrl('/oauth/' + service),
      scope: credentials.services[service].scope,
      state: state
    };

    authRequests.push({
      expires: new Date(time.getTime() + 3600000),
      redirect: redirect,
      service: service,
      state: state
    });

    return credentials.services[service].baseUrl + qs.stringify(query);
  };

  const authUrls = Object.keys(credentials.services).reduce((urls, service) => {
    urls[service] = getAuthUrl(service, config.baseUrl + '/account');
    return urls;
  }, {});

  res.render('login', { authUrls: authUrls });

};

exports.oauth = function (req, res) {

  var tokens = {};

  const authRequest = authRequests.filter((authReq, i, arr) => {
    if (authReq.expires < new Date()) { arr.splice(i, 1); }
    return authReq.state === req.query.state;
  })[0];

  const getAccessToken = function (service, code) {
    return new Promise(function(resolve, reject) {

      const body = qs.stringify({
        code: code,
        client_id: credentials.services[service].clientId,
        client_secret: credentials.services[service].secret,
        grant_type: 'authorization_code',
        redirect_uri: config.mapUrl('/oauth/' + service)
      });

      const options = {
        hostname: credentials.services[service].host,
        method: 'POST',
        path: credentials.services[service].path,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var tokenReq = https.request(options, res => {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk );
        res.on('end', () => {
          tokens = JSON.parse(data);
          resolve();
        });
      });
      tokenReq.on('error', err => reject(err) );
      tokenReq.end(body, 'utf8');

    });
  };

  const getUser = function (service, userId) {
    return new Promise(function(resolve, reject) {
      console.log('Getting the user from the database.');
    });
  };

  const renderError = function (err) {
    res.render('error', { code: 500, message: JSON.stringify(err) });
  };

  getAccessToken(authRequest.service, req.query.code)
  .then(getUser)
  .catch(renderError);

  res.render('test', { test: 'Processing OAuth response' });

};
