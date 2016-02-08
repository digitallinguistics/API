var api = require('./api');

/**
 * Middleware that allows options to be set for each route.
 * @param   {function} handler               The API handler that will receive the request, response, and next objects.
 * @param   {object} opts                    An optional options hash.
 * @prop    {boolean} opts.protect           Whether the route should be protected (require a valid DLx token). Defaults to <code>true</code>.
 * @prop    {boolean} opts.scope             The allowed scope for this path. Defaults to <code>user</code>.
 * @returns {function}                       Returns the API handler.
 */
const route = (handler, opts) => {
  return (req, res, next) => {
    if (opts.protect && req.authStatus !== 'valid') {
      respond('invalid_request', 401, res);
    } else if ((opts.scope && req.authScope !== opts.scope) || req.authScope !== 'user') {
      respond('Operation not allowed.', 405, res);
    } else {
      handler(req, res, next);
    }
  };
};

module.exports = app => {

  app.get('/auth', route(api.auth, { protect: false }));
  app.post('/oauth', route(api.oauth, { scope: 'db' }));

  app.post('/v1/apps/:appId', route(api.updateApp));
  app.post('/v1/apps', route(api.upsertApps, { scope: 'db' }));
  app.delete('/v1/apps', route(api.deleteApps, { scope: 'db' }));
  app.get('/v1/apps', route(api.getApps, { scope: 'db' }));
  app.put('/v1/apps', route(api.registerApp, { scope: 'db' }));

  app.delete('/v1/bundles/:bundleId/items/:itemId', route(api.removeBundleItem));
  app.get('/v1/bundles/:bundleId/items/:itemId', route(api.getBundleItem, { protect: false }));
  app.post('/v1/bundles/:bundleId/items/:itemId', route(api.updateBundleItem));
  app.put('/v1/bundles/:bundleId/items/:itemId', route(api.upsertBundleItem));

  app.delete('/v1/lexicons/:lexiconId/entries/:entryId', route(api.deleteLexEntry));
  app.get('/v1/lexicons/:lexiconId/entries/:entryId', route(api.getLexEntry, { protect: false }));
  app.put('/v1/lexicons/:lexiconId/entries/:entryId', route(api.upsertLexEntry));

  app.get('/v1/texts/:textId/phrases/:phraseId', route(api.getPhrase, { protect: false }));

  app.delete('/v1/users/:userId', route(api.deleteUser, { scope: 'db' }));
  app.get('/v1/users/:userId', route(api.getUser, { scope: 'db' }));
  app.post('/v1/users/:userId', route(api.updateUser));
  app.put('/v1/users', route(api.registerUser, { scope: 'db' }));
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
