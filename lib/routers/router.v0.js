const handlers = require('../handlers').v0;
const methods  = require('../methods');

module.exports = router => {
  router.all('/test', methods(), handlers.test); // test route
};
