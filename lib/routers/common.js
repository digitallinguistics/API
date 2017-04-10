const handlers = require('../handlers').common;
const methods  = require('../methods');
const passport = require('../passport');

module.exports = app => {

  // add routes for OAuth
  app.route('/auth').all(methods(['GET', 'POST']), handlers.auth);
  app.all('/auth/test', handlers.authTest);
  app.get('/oauth', passport.authenticate('auth0'), handlers.oauth);
  app.all('/test', handlers.test);

  // generic error handlers
  app.use(handlers.notFound); // 404 error
  app.use(handlers.errors);   // 500 error

};
