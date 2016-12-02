const Handlers = require('../handlers'); // handlers for all API versions
const handlers = Handlers.v0;            // handlers for v0.x
const methods  = require('../methods');  // middleware for whitelisting methods

module.exports = router => {

  // route handlers
  router.all('/', methods(), handlers.home);     // test route for Lindsey
  router.all('/test', methods(), handlers.test); // test route

  // generic error handlers
  router.use(Handlers.notFound); // 404 error
  router.use(Handlers.errors);   // 500 error

};
