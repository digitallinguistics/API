const handlers = require('./handlers');

module.exports = app => {

  // route handlers
  app.get('/', handlers.home);

  // generic error handlers
  app.use(handlers.error404);
  app.use(handlers.error500);

};
