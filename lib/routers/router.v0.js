const authenticate     = require('../authenticate');
const methods          = require('../methods');
const testHandler      = require('../../test/handlers').main;
const { v0: handlers } = require('../handlers');

module.exports = router => {
  router.all('/test', methods(), authenticate, testHandler); // test route
};
