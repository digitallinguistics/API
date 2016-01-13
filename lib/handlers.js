var auth = require('./auth');
var db = require('./db');

exports.account = function (req, res) {
  res.render('test', { test: 'Account' });
};

exports.developer = function (req, res) {
  res.render('test', { test: 'Developer' });
};

exports.devRegistration = function (req, res) {
  res.render('test', { test: 'Developer Registration' });
};

exports.docs = function (req, res) {
  res.render('test', { test: 'Documentation' });
};

exports.home = function (req, res) {
  res.render('test', { test: 'Home' });
};

exports.register = function (req, res) {
  if (req.method === 'GET') { res.render('register'); }
  else {
    const authRequest = auth.lookupAuthRequest(req.signedCookies.state);
    if (!authRequest) { res.render('error', { code: 500, message: `There was a problem registering your account. Please return to the <a class=link href=/login>Login page</a> and try again.` }); }
    else {

      const userInfo = {
        userId: req.body.email,
        affiliation: req.body.affiliation,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        services: {
          [authRequest.service]: authRequest.userId
        }
      };

      db.registerUser(userInfo)
      .then((res) => console.log(res) )
      .catch((err) => console.error(err) );

    }
  }
};

exports.test = function (req, res) {
  res.render('test', { test: 'Test' });
};
