const authenticate               = require(`../../middleware/authenticate`);
const { common: handlers, test } = require(`../../handlers/rest`);

module.exports = app => {
  app.all(`/test`, authenticate, test.main); // generic test route
  app.all(`/test/callback`, test.callback);  // OAuth callback route
  app.all(`/test/code`, test.code);          // authorization code grant test
  app.all(`/test/implicit`, test.implicit);  // implicit grant test
  app.use(handlers.notFound);                // 404 error
  app.use(handlers.errors);                  // 500 error
};
