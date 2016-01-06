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

exports.login = function (req, res) {
  res.render('test', { test: 'Login' });
};

exports.register = function (req, res) {
  res.render('test', { test: 'Register' });
};

exports.test = function (req, res) {
  res.render('test', { test: 'Test' });
};
