var auth = require('./auth');

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

    const directUser = info => {
      res.cookie('user', info.id, { maxAge: 3660000, signed: true });
      res.cookie('userName', info.userName, { maxAge: 3660000, signed: true });
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
