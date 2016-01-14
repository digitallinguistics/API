var auth = require('./auth');

exports.account = function (req, res) {

  const renderError = () => {
    res.render('error', { code: 500, message: `There was a problem retrieving your account information. <a class=link href=/login>Please try logging in again.</a>.` });
  };

  if (!req.signedCookies.user) { renderError(); }
  else {
    var user = auth.getUserInfo(req.signedCookies.user);
    if (!user) { renderError(); }
    res.render('account', { user: user });
  }
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

    const directUser = info => {
      res.cookie('user', info.userId, { maxAge: 3660000, signed: true });
      res.redirect(info.redirect);
    };

    const renderError = (err) => {
      res.render('error', { code: err.code || 500, message: err.message || JSON.stringify(err) });
    };

    const userInfo = {
      userId: req.body.email,
      affiliation: req.body.affiliation,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    };

    auth.processRegistration(userInfo, req.signedCookies.state)
    .then(directUser)
    .catch(renderError);

  }
};

exports.test = function (req, res) {
  res.render('test', { test: 'Test' });
};
