const config = require('./config');
const credentials = require('./credentials');
const db = require('./db');
const https = require('https');
const qs = require('querystring');
const uuid = require('uuid');

db.ready();

const authRequests = [];
const clientAuthRequests = [];

const getAuthUrl = (service, redirect, state) => {

  const time = new Date();
  const serviceConfig = credentials.services[service][global.env];
  state = state || uuid.v4();

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

const grantAccess = user => {
  return new Promise((resolve, reject) => {
    console.log(user);
    user.updateToken();
    db.updateUser(user)
    .then(resolve)
    .catch(reject);
  });
};

exports.authenticate = (req, res) => {
  return new Promise((resolve) => {
    if (req.loggedIn) { resolve(res.locals.user); }
    else {
      req.query.redirect = req.url;
      exports.login(req, res);
    }
  });
};

exports.checkToken = (req, res) => {
  switch (req.authStatus) {
    case 'missing': r.res('invalid_request', 401, res); return false;
    case 'invalid': r.res('invalid_request', 401, res); return false;
    case 'expired': r.res('invalid_request', 419, res); return false;
    default: return true;
  }
};

exports.grant = (req, res) => {

  if (!req.query.client_id) {
    r.res(`Please provide a <code>client_id</code> parameter in the query string. The client ID for your application can be found on the <a class=link href=/developer>Developer page</a> under <em>Application ID</em>. More details on authentication are available <a class=link href=${config.package.homepage}>here</a>.`, 400, res);
  } else if (!req.query.redirect_uri) {
    r.res(`Please provide a <code>redirect_uri</code> parameter in the query string. More details on authentication are available <a class=link href=${config.package.homepage}>here</a>.`, 400, res);
  } else if (!req.query.response_type || req.query.response_type !== 'token') {
    r.res(`Please provide a <code>response_type</code> parameter in the query string, with a value of <code>token</code>. More details on authentication are available <a class=link href=${config.package.homepage}>here</a>.`, 400, res);
  } else {
    if (!req.query.state) { req.query.state = uuid.v4(); }

    clientAuthRequests.push(req.query);

    const authenticate = app => {
      return new Promise((resolve, reject) => {
        if (app) {
          req.url = req.query.redirect_uri;
          exports.authenticate(req, res).then(resolve).catch(reject);
        } else { reject(r.json('No app with that ID found.', 400)); }
      });
    };

    const redirect = user => {
      const params = {
        access_token: user.dlxToken,
        expires_in: 3600,
        state: req.query.state
      };

      res.redirect(req.query.redirect_uri + '#' + qs.stringify(params));
    };

    db.getAppById(req.query.client_id)
    .then(authenticate)
    .then(grantAccess)
    .then(redirect)
    .catch(err => r.res(err, res));

  }

};

exports.login = (req, res) => {

  const authUrls = Object.keys(credentials.services).reduce((urls, service) => {
    urls[service] = getAuthUrl(service, req.query.redirect || '/account', req.query.state);
    return urls;
  }, {});

  res.render('login', { authUrls: authUrls });
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

  if (!authReq) { r.res('There was a problem authenticating the user. Please try your request again.', res); }
  else {

    const clientAuthReq = clientAuthRequests.filter(clientReq => clientReq.state === authReq.state)[0];

    const params = { state: authReq.state };

    const clientAuth = user => {
      return new Promise((resolve, reject) => {
        if (clientAuthReq) {
          grantAccess(user)
          .then(user => {
            params.access_token = user.dlxToken;
            params.expires_in = 3600;
            params.token_type = 'bearer';
            resolve(user);
          })
          .catch(reject);
        } else {
          resolve(user);
        }
      });
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
      res.redirect(authReq.redirect + (clientAuthReq ? '#' : '?') + qs.stringify(params));
    };

    const register = () => {
      return new Promise((resolve) => {
        if (req.cookies.register) {
          authReq.register = true;
          res.redirect('/register?' + qs.stringify(params));
        } else {
          resolve();
        }
      });
    };

    getAccessToken(authReq.service, req.query.code)
    .then(register)
    .then(getUser)
    .then(clientAuth)
    .then(redirect)
    .catch(err => r.res(err, null, res));

  }

};
