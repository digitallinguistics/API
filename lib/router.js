const handlers = require('./handlers');

module.exports = app => {

  // route handlers

  // generic error handlers
  app.use(handlers.notFound);
  app.use(handlers.errors);

};
