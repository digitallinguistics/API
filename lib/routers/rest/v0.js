const authenticate = require(`../../middleware/authenticate`);
const checkScope   = require(`../../middleware/scope`);

const {
  common,
  test,
  v0: handlers,
} = require(`../../handlers/rest`);

module.exports = router => {

  router.route(`/languages`)
  .delete(checkScope, handlers.deleteAll)
  .get(handlers.getAll)
  .put(checkScope, handlers.upsertAll)
  .all(common.methodNotAllowed);

  router.route(`/languages/:language`)
  .delete(checkScope, handlers.delete)
  .get(handlers.get)
  .put(checkScope, handlers.upsert)
  .all(common.methodNotAllowed);

  router.route(`/test`)
  .get(authenticate, test.main)
  .all(common.methodNotAllowed);

};
