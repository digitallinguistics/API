var auth = require('./auth');

exports.account = function (req, res) {

  const renderError = () => {
    res.render('error', { code: 500, message: `There was a problem retrieving your account information. <a class=link href=/login>Please try logging in again</a>.` });
  };
  if (!res.locals.user) { renderError(); }
  else { res.render('account'); }
};

exports.developer = function (req, res) {

  if (req.method === 'GET') {

    res.render('developer');

  } else if (req.method === 'POST') {
    res.render('test', { test: 'Processing app registration.' });
  }

};

exports.docs = function (req, res) {
  res.render('test', { test: 'Documentation' });
};

exports.home = function (req, res) {
  res.render('test', { test: 'Home' });
};

exports.register = function (req, res) {
  if (req.method === 'GET') { res.render('register'); }
  else if (req.method === 'POST') {

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
