const handlers = require('../handlers').v0; // handlers for all API versions
const methods  = require('../methods');     // middleware for whitelisting methods

module.exports = router => {
  router.all('/', methods(), handlers.home);     // test route for Lindsey
  router.all('/test', methods(), handlers.test); // test route
};
