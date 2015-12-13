var api = require('./api');
var handlers = require('./handlers');

module.exports = function (app) {
  app.get('/', handlers.home); // render homepage
  app.get('/account', handlers.account); // login || account page (depending on authentication)
  app.get('/login', handlers.account); // same as '/account'
  app.get('/test', handlers.test); // testing and debugging

  app.get('/auth', api.auth); // handling client implicit grant requests
  app.get('/oauth', api.oauth); // handling OAuth redirect from services
};
