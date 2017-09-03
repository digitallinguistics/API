const checkScope = require(`./middleware/scope`);
const config     = require(`../config`);
const handlers   = require(`./handlers`);
const errors     = require(`./errors`);
const test       = require(`../../test/handlers`);

module.exports = router => {

  router.route(`/languages`)
  .get(handlers.getAll)
  .post(checkScope, handlers.create)
  .put(checkScope, handlers.upsert)
  .all(errors.methodNotAllowed);

  router.route(`/languages/:language`)
  .delete(checkScope, handlers.delete)
  .get(handlers.get)
  .patch(checkScope, handlers.update)
  .all(errors.methodNotAllowed);

  router.route(`/languages/:language/lexemes`)
  .get(handlers.getAll)
  .post(checkScope, handlers.create)
  .put(checkScope, handlers.upsert)
  .all(errors.methodNotAllowed);

  router.route(`/languages/:language/lexemes/:lexeme`)
  .delete(checkScope, handlers.delete)
  .get(handlers.get)
  .patch(checkScope, handlers.update)
  .all(errors.methodNotAllowed);

  // do not load test routes on production (JWTs will be exposed)
  if (config.localhost) {
    router.all(`/test/callback`, test.callback);
    router.all(`/test/code`, test.code);
    router.all(`/test/implicit`, test.implicit);
  }

};
