var db = require('./db');
var env = require('./env');

var logErrors = function (err) {
  console.error(err);
  throw new Error(err);
};

// renders account or login page depending on whether user is authenticated
exports.account = function (req, res) {

  var loginUser = function () {
    if (!req.signedCookies.session) {
      res.render('test', { test: 'Login Page' });
    } else {
      db.getSessionUser(req.signedCookies.session)
      .then(function (user) {
        res.cookie('session', req.signedCookies.session, { maxAge: 3660000, signed: true });
        res.render('account', { new: false, user: user });
      })
      .catch(logErrors);
    }
  };

  switch (req.path) {
    case '/account':
      loginUser();
      break;
    case '/login':
      loginUser();
      break;
    case '/register':
      res.clearCookie('session');
      res.render('account', { new: true });
      break;
    default:
      res.render('test', { test: 'Login Page' });
  }

};

exports.developer = function (req, res) {
  res.render('test', { test: 'Developer Page' });
};

exports.docs = function (req, res) {
  // docs/readme
  // docs/api
  res.redirect(env.mapBaseUrl('/swagger.html'));
};

exports.home = function (req, res) {
  res.render('home');
};

exports.test = function (req, res) {
  res.render('test', { test: 'This is a test page.' });
};
