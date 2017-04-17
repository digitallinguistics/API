const authenticate = require(`../../middleware/authenticate`);

const {
  common,
  test,
  v0: handlers,
} = require(`../../handlers/rest`);

module.exports = router => {

  router.route(`/languages`)
  .put(handlers.upsertLanguages)
  .all(common.methodNotAllowed);

  router.get(`/test`, authenticate, test.main);

};
