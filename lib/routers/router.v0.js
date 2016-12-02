const handlers = require('../handlers').v0;
const methods  = require('../methods');

module.exports = router => {
  // TODO: migrate Lindsey to the "/test" route, and then delete the "/" route
  router.all('/', methods(), handlers.home);     // test route for Lindsey
  router.all('/test', methods(), handlers.test); // test route
};
