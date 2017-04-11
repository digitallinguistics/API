const handlers     = require('../handlers').common;
const methods      = require('../middleware/methods');
const passport     = require('../middleware/passport');
const testHandlers = require('../../test/handlers');

module.exports = app => {

  // add routes for OAuth
  app.all('/auth', methods(['GET', 'POST']), handlers.auth);
  app.all('/oauth', methods(), passport.authenticate('auth0'), handlers.oauth);
  app.all('/token', methods(['POST']), handlers.token);
  app.all('/test', testHandlers.main);
  app.all('/test/callback', testHandlers.callback);
  app.all('/test/client', testHandlers.client);
  app.all('/test/code', testHandlers.code);
  app.all('/test/implicit', testHandlers.implicit);

  // generic error handlers
  app.use(handlers.notFound); // 404 error
  app.use(handlers.errors);   // 500 error

};
