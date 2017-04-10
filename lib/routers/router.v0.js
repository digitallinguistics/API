const methods  = require('../methods');
const { common, v0: handlers } = require('../handlers');

module.exports = router => {
  router.all('/test', methods(), common.test); // test route
};
