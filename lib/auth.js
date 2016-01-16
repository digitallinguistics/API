var config = require('./config');
var credentials = require('./credentials');
var db = require('./db');
var https = require('https');
var qs = require('querystring');
var uuid = require('uuid');

db.ready();

const authRequests = [];

exports.getAuthUrl = (service, redirect) => {

  const time = new Date();
  const serviceConfig = credentials.services[service][global.env];
  const state = uuid.v4();

  const query = {
    client_id: serviceConfig.clientId,
    response_type: 'code',
    redirect_uri: config.mapUrl('/oauth/' + service),
    scope: serviceConfig.scope,
    state: state
  };

  authRequests.push({
    expires: new Date(time.getTime() + 3600000),
    redirect: redirect || '/account',
    service: service,
    state: state
  });

  return serviceConfig.baseUrl + qs.stringify(query);
};

exports.grant = (req, res) => {
  res.redirect('http://jmangel.github.io');
};

exports.lookupAuthReq = state => {
  return authRequests.filter((authReq, i, arr) => {
    if (authReq.expires < new Date()) { arr.splice(i, 1); }
    return authReq.state === state;
  })[0];
};

exports.oauth = (req, res) => {

  var tokens = {};
  const authReq = exports.lookupAuthReq(req.query.state);
  const stateParam = '?' + qs.stringify({ state: authReq.state });

  const renderError = (err) => {
    res.render('error', { code: err.code || 500, message: err.message || JSON.stringify(err) });
  };

  if (!authReq) { renderError('There was a problem authenticating the user. Please try your request again.'); }

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
          authReq.serviceId = tokens.user_id;
          resolve();
        });
      });
      tokenReq.on('error', err => reject(err) );
      tokenReq.end(body, 'utf8');

    });
  };

  const getUser = () => {
    return new Promise((resolve, reject) => {
      db.getUserById(authReq.serviceId, authReq.service).then(resolve).catch(reject);
    });
  };

  const redirect = user => {
    res.login(user.rid);
    res.redirect(authReq.redirect + stateParam);
  };

  const register = () => {
    return new Promise((resolve) => {
      if (req.cookies.register) {
        authReq.register = true;
        res.redirect('/register' + stateParam);
      } else {
        resolve();
      }
    });
  };

  getAccessToken(authReq.service, req.query.code)
  .then(register)
  .then(getUser)
  .then(redirect)
  .catch(renderError);

};
