const authenticate = require(`../../middleware/authenticate`);
const checkScope   = require(`../../middleware/scope`);

const {
  common,
  test,
  v0: handlers,
} = require(`../../handlers/rest`);

module.exports = router => {

  router.route(`/languages`)
  .delete(checkScope, handlers.deleteLanguages)
  .get(handlers.getLanguages)
  .put(checkScope, handlers.upsertLanguages)
  .all(common.methodNotAllowed);

  router.route(`/languages/:language`)
  .delete(checkScope, handlers.deleteLanguage)
  .get(handlers.getLanguage)
  .put(checkScope, handlers.upsertLanguage)
  .all(common.methodNotAllowed);

  router.get(`/test`, authenticate, test.main);

};
