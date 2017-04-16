const authenticate = require('../middleware/authenticate');
const methods      = require('../middleware/methods');

const { test, v0 } = require('../handlers');

module.exports = router => {
  router.all('/test', methods(), authenticate, test.main);
};
