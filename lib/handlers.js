var baseUrl = require('./baseUrl');

exports.account = function () {
};

exports.docs = function (req, res) {
  res.redirect(baseUrl.map('/swagger.html'));
};

exports.home = function (req, res) {
  res.render('home');
};

exports.test = function () {
};
