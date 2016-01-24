var auth = require('./auth');
var db = require('./db');

const userError = { status: 500, details: `There was a problem retrieving your account information. <a class=link href=/login>Please try logging in again.</a>` };

exports.account = (req, res) => {

  if (req.method === 'GET') {

    auth.authenticate(req, res)
    .then(() => {
      if (!res.locals.user) { renderError(userError, res); }
      else { res.render('account'); }
    })
    .catch(err => renderError(err, res));

  } else if (req.method === 'POST') {

    delete req.body.updateInfoButton;
    Object.assign(res.locals.user, req.body);

    db.updateUser(res.locals.user)
    .then(user => { res.locals.user = user; res.render('account'); })
    .catch(err => renderError(err, res));

  }

};

exports.developer = (req, res) => {

  const render = () => { res.render('developer', { apps: res.locals.user.apps }); };

  if (req.method === 'GET') {

    auth.authenticate(req, res)
    .then(() => {
      if (res.locals.user) { render(); }
      else { renderError(userError, res); }
    })
    .catch(err => renderError(err, res));

  } else if (req.method === 'POST') {

    const updateUser = app => {
      return new Promise((resolve, reject) => {

        res.locals.user.apps.push(app);

        db.updateUser(res.locals.user)
        .then(user => { res.locals.user = user; resolve(); })
        .catch(reject);

      });
    };

    db.createApp(req.body.appName)
    .then(updateUser)
    .then(render)
    .catch(err => renderError(err, res));

  }

};

exports.docs = (req, res) => {
  res.render('test', { test: 'Documentation' });
};

exports.home = (req, res) => {
  res.render('test', { test: 'Home' });
};

exports.login = (req, res) => {
  auth.login(req, res);
};

exports.register = (req, res) => {
  res.clearCookie('register');

  if (req.method === 'GET') { res.render('register', { state: req.query.state }); }

  else if (req.method === 'POST') {

    const authReq = auth.lookupAuthReq(req.query.state || req.body.state);

    if (!authReq) { renderError({ status: 500, details: `There was a problem creating your account. <a class=link href=/login?register=true>Please try again.</a>` }); }

    const userInfo = {
      userId: req.body.email,
      affiliation: req.body.affiliation,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      services: { [authReq.service]: authReq.serviceId }
    };

    const redirect = user => {
      res.login(user.rid);
      res.redirect(authReq.redirect || '/account');
    };

    db.registerUser(userInfo)
    .then(redirect)
    .catch(err => renderError(err, res));

  }
};

exports.test = (req, res) => {
  res.render('test', { test: 'Test' });
};
