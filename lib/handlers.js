var baseUrl = require('./baseUrl');

// renders account or login page depending on whether user is authenticated
exports.account = function (req, res) {
  res.render('test', { test: 'Account || Login' });
};

exports.docs = function (req, res) {
  res.redirect(baseUrl.map('/swagger.html'));
};

exports.home = function (req, res) {
  res.render('home');
};

exports.test = function (req, res) {
  res.render('test', { test: 'This is a test page.' });
};
