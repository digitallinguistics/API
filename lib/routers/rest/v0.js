const authenticate = require(`../../middleware/authenticate`);

const {
  common,
  test,
  v0: handlers,
} = require(`../../handlers/rest`);

module.exports = router => {

  router.route(`/languages`)
  .get(handlers.getLanguages)
  .put(handlers.upsertLanguages)
  .all(common.methodNotAllowed);

  router.route(`/languages/:language`)
  .get(handlers.getLanguage)
  .put(handlers.upsertLanguage)
  .all(common.methodNotAllowed);

  router.get(`/test`, authenticate, test.main);

};
