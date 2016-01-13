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
    console.log(req.body);
  }
};

exports.test = function (req, res) {
  res.render('test', { test: 'Test' });
};
