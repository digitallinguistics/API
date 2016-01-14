var config = require('./config');
var credentials = require('./credentials');
var db = require('./db');
var https = require('https');
var qs = require('querystring');
var uuid = require('uuid');

db.ready();

const authRequests = [];

exports.grant = (req, res) => {
  res.render('test', { test: 'Issuing grant.' });
};

exports.login = (req, res) => {

  var getAuthUrl = (service, redirect) => {

    const time = new Date();
    const serviceConfig = credentials.services[service][global.env];
    const state = uuid.v4();

    res.cookie('state', state, { maxAge: 3660000, signed: true });

    const query = {
      client_id: serviceConfig.clientId,
      response_type: 'code',
      redirect_uri: config.mapUrl('/oauth/' + service),
      scope: serviceConfig.scope,
      state: state
    };

    authRequests.push({
      expires: new Date(time.getTime() + 3600000),
      redirect: redirect,
      service: service,
      state: state
    });

    return serviceConfig.baseUrl + qs.stringify(query);
  };

  const authUrls = Object.keys(credentials.services).reduce((urls, service) => {
    urls[service] = getAuthUrl(service, config.baseUrl + '/account');
    return urls;
  }, {});

  res.render('login', { authUrls: authUrls });

};

exports.lookupAuthRequest = (state) => {
  return authRequests.filter((authReq, i, arr) => {
    if (authReq.expires < new Date()) { arr.splice(i, 1); }
    return authReq.state === state;
  })[0];
};

exports.oauth = (req, res) => {

  var tokens = {};

  const renderError = (err) => {
    res.render('error', { code: err.code || 500, message: err.message || JSON.stringify(err) });
  };

  const authRequest = exports.lookupAuthRequest(req.query.state);

  if (!authRequest) { renderError('There was a problem authenticating the user. Please try your request again.'); }

  const directUser = (user) => {
    if (!user) { res.render('error', { code: 500, message: `No DLX account was found using that login. <a class=link href=/login>Try logging in with a different service</a> or <a class=link href=/register>register for a new account</a>.` }); }
    else {
      // need to finish this
      res.render('test', { test: 'Redirecting user to originally-requested location (authRequest.redirect).' });
    }
  };

  const getAccessToken = (service, code) => {
    return new Promise((resolve, reject) => {

      const serviceConfig = credentials.services[service][global.env];

      const body = qs.stringify({
        code: code,
        client_id: serviceConfig.clientId,
        client_secret: serviceConfig.secret,
        grant_type: 'authorization_code',
        redirect_uri: config.mapUrl('/oauth/' + service)
      });

      console.log(body);

      const options = {
        hostname: serviceConfig.host,
        method: 'POST',
        path: serviceConfig.path,
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
          authRequest.userId = tokens.user_id;
          resolve();
        });
      });
      tokenReq.on('error', err => reject(err) );
      tokenReq.end(body, 'utf8');

    });
  };

  const getUser = () => {
    return new Promise((resolve, reject) => {
      db.getUserById(authRequest.user_id, authRequest.service)
      .then(resolve)
      .catch(reject);
    });
  };

  getAccessToken(authRequest.service, req.query.code)
  .then(getUser)
  .then(directUser)
  .catch(renderError);

};
