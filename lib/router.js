var api = require('./api');

/**
 * Middleware that allows options to be set for each route.
 * @param   {function} handler               The API handler that will receive the request, response, and next objects.
 * @param   {object} opts                    An optional options hash.
 * @prop    {boolean} opts.protect           Whether the route should be protected (require a valid DLx token). Defaults to <code>true</code>.
 * @prop    {boolean} opts.scopes             The allowed scopes for this path. Defaults to <code>['user']</code>.
 * @returns {function}                       Returns the API handler.
 */
const route = (handler, opts) => {
  opts = opts || { protect: true, scopes: ['user'] };
  opts.protect = opts.protect === false ? false : true;
  return (req, res, next) => {
    console.log(opts.protect, opts.scope, req.authScope, req.authStatus);
    if (opts.protect && req.authStatus !== 'valid') {
      respond('invalid_request', 401, res);
    } else if ((opts.scopes && !opts.scopes.includes(req.authScope)) || ((!opts.scopes) && req.authScope !== 'user')) {
      respond('Operation not allowed.', 405, res);
    } else {
      handler(req, res, next);
    }
  };
};

module.exports = app => {

  app.get('/auth', route(api.auth, { protect: false, scopes: ['public', 'user'] }));
  app.post('/oauth', route(api.oauth, { scopes: ['db'] }));

  app.post('/v1/apps/:appId', route(api.updateApp));
  app.post('/v1/apps', route(api.upsertApps, { scopes: ['db'] }));
  app.delete('/v1/apps', route(api.deleteApps, { scopes: ['db'] }));
  app.get('/v1/apps', route(api.getApps, { scopes: ['db'] }));
  app.put('/v1/apps', route(api.registerApp, { scopes: ['db'] }));

  app.delete('/v1/bundles/:bundleId/items/:itemId', route(api.removeBundleItem));
  app.get('/v1/bundles/:bundleId/items/:itemId', route(api.getBundleItem, { protect: false }));
  app.post('/v1/bundles/:bundleId/items/:itemId', route(api.updateBundleItem));
  app.put('/v1/bundles/:bundleId/items/:itemId', route(api.upsertBundleItem));

  app.delete('/v1/lexicons/:lexiconId/entries/:entryId', route(api.deleteLexEntry));
  app.get('/v1/lexicons/:lexiconId/entries/:entryId', route(api.getLexEntry, { protect: false }));
  app.put('/v1/lexicons/:lexiconId/entries/:entryId', route(api.upsertLexEntry));

  app.get('/v1/texts/:textId/phrases/:phraseId', route(api.getPhrase, { protect: false }));

  app.delete('/v1/users/:userId', route(api.deleteUser, { scopes: ['db'] }));
  app.get('/v1/users/:userId', route(api.getUser, { scopes: ['db'] }));
  app.post('/v1/users/:userId', route(api.updateUser));
  app.put('/v1/users', route(api.registerUser, { scopes: ['db'] }));
  app.post('/v1/users', route(api.updateUsers));

  app.delete('/v1/:collection/:itemId', route(api.deleteItem));
  app.get('/v1/:collection/:itemId', route(api.getItem, { protect: false }));
  app.post('/v1/:collection/:itemId', route(api.updateItem));
  app.put('/v1/:collection/:itemId', route(api.upsertItem));

  app.delete('/v1/:collection', route(api.deleteFromCollection));
  app.get('/v1/:collection', route(api.getFromCollection, { protect: false }));
  app.post('/v1/:collection', route(api.updateCollectionItems));
  app.put('/v1/:collection', route(api.upsertToCollection));

};
