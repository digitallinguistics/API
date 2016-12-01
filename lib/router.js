const handlers = require('./handlers');

module.exports = app => {

  // route handlers
  app.get('/', handlers.home);

  // generic error handlers
  app.use(handlers.notFound);
  app.use(handlers.errors);

};
