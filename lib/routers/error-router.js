const errors = require(`../handlers/error-handlers`);

module.exports = router => {
  router.use(errors.notFound);
  router.use(errors.serverError);
};
