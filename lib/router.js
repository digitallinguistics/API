const handlers = require('./handlers');
const methods = handlers.methods;

module.exports = app => {

  // route handlers
  app.all('/', methods(), handlers.home);     // test route for Lindsey
  app.all('/test', methods(), handlers.test); // test route

  // generic error handlers
  app.use(handlers.notFound);  // 404 error
  app.use(handlers.errors);    // 500 error

};
