const authenticate               = require(`../../middleware/authenticate`);
const config                     = require(`../../config`);
const { common: handlers, test } = require(`../../handlers/rest`);

module.exports = app => {

  if (config.localhost) {
    // do not load test routes on production (JWTs will be exposed)
    app.all(`/test`, authenticate, test.main); // generic test route
    app.all(`/test/callback`, test.callback);  // OAuth callback route
    app.all(`/test/code`, test.code);          // authorization code grant test
    app.all(`/test/implicit`, test.implicit);  // implicit grant test
  }

  app.use(handlers.notFound);                  // 404 error
  app.use(handlers.serverError);               // 500 error

};
