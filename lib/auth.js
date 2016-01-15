var config = require('./config');
var credentials = require('./credentials');
var db = require('./db');
var https = require('https');
var qs = require('querystring');
var uuid = require('uuid');

db.ready();

const authRequests = [];
const usersLoggedIn = [];

const lookupAuthRequest = state => {
  return authRequests.filter((authReq, i, arr) => {
    if (authReq.expires < new Date()) { arr.splice(i, 1); }
    return authReq.state === state;
  })[0];
};

exports.getUserInfo = userId => {
  return usersLoggedIn.filter(user => userId === user.rid)[0];
};

exports.grant = (req, res) => {
  res.redirect('http://jmangel.github.io');
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

exports.oauth = (req, res) => {

  var tokens = {};
  const authRequest = lookupAuthRequest(req.query.state);

  const renderError = (err) => {
    res.render('error', { code: err.code || 500, message: err.message || JSON.stringify(err) });
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
          authRequest.userId = tokens.user_id;
          resolve();
        });
      });
      tokenReq.on('error', err => reject(err) );
      tokenReq.end(body, 'utf8');

    });
  };

  const loginOrRegister = () => {
    if (req.cookies.register) { res.render('register'); }
    else {

      const directUser = user => {
        usersLoggedIn.push(user);
        res.cookie('user', user.rid, { maxAge: 3660000, signed: true });
        res.redirect(authRequest.redirect);
      };

      const handleErrors = err => {
        if (err.code === 404) {
          res.render('error', { code: 404, message: `The user logged in with ${authRequest.service.toUpperCase()} cannot be found. <a class=link href=/login>Try logging in with a different service</a>, or <a class=link href=/login?register=true>create a new account</a>.` });
        }
      };

      res.cookie('user', 12345, { expires: new Date(), signed: true });

      db.getUserById(authRequest.userId, authRequest.service)
      .then(directUser)
      .catch(handleErrors);
    }
  };

  if (!authRequest) { renderError('There was a problem authenticating the user. Please try your request again.'); }

  getAccessToken(authRequest.service, req.query.code)
  .then(loginOrRegister)
  .catch(renderError);

};

exports.processRegistration = (userInfo, state) => {
  return new Promise((resolve, reject) => {

    const authRequest = lookupAuthRequest(state);

    if (!authRequest) {
      reject({ code: 500, message: `There was a problem registering your account. Please return to the <a class=link href=/login>Login page</a> and try again.` });
    } else {

      const returnUserInfo = user => {
        resolve({
          userId: user._rid,
          redirect: authRequest.redirect
        });
      };

      const handleError = res => {
        if (res.code === 409) {
          reject({ code: 409, message: `A user with this email already exists. <a class=link href=/login>Try logging in with the services on the login page</a>.` });
        }
      };

      userInfo.services = { [authRequest.service]: authRequest.userId };

      db.registerUser(userInfo)
      .then(returnUserInfo)
      .catch(handleError);
    }

  });
};

exports.updateUser = newUser => {
  usersLoggedIn.forEach((oldUser, i, arr) => {
    if (newUser.id === oldUser.id) { arr[i] = newUser; }
  });
};
