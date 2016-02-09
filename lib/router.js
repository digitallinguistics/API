const api = require('./api');
const security = require('./security');
const requireAdminToken = security.requireAdminToken;
const requireOAuthToken = security.requireOAuthToken;
const requireUserToken = security.requireUserToken;
const verifyUserToken = security.verifyUserToken;

module.exports = app => {

  app.get('/auth', verifyUserToken, api.auth);
  app.post('/oauth', requireOAuthToken, api.oauth);

  app.post('/v1/apps/:appId', requireUserToken, api.updateApp);
  app.post('/v1/apps', requireAdminToken, api.upsertApps);
  app.delete('/v1/apps', requireAdminToken, api.deleteApps);
  app.get('/v1/apps', verifyUserToken, api.getApps);
  app.put('/v1/apps', requireAdminToken, api.registerApp);

  app.delete('/v1/bundles/:bundleId/items/:itemId', requireUserToken, api.removeBundleItem);
  app.get('/v1/bundles/:bundleId/items/:itemId', verifyUserToken, api.getBundleItem);
  app.post('/v1/bundles/:bundleId/items/:itemId', requireUserToken, api.updateBundleItem);
  app.put('/v1/bundles/:bundleId/items/:itemId', requireUserToken, api.upsertBundleItem);

  app.delete('/v1/lexicons/:lexiconId/entries/:entryId', requireUserToken, api.deleteLexEntry);
  app.get('/v1/lexicons/:lexiconId/entries/:entryId', verifyUserToken, api.getLexEntry);
  app.put('/v1/lexicons/:lexiconId/entries/:entryId', requireUserToken, api.upsertLexEntry);

  app.get('/v1/texts/:textId/phrases/:phraseId', verifyUserToken, api.getPhrase);

  app.delete('/v1/users/:userId', requireAdminToken, api.deleteUser);
  app.get('/v1/users/:userId', requireAdminToken, api.getUser);
  app.post('/v1/users/:userId', requireUserToken, api.updateUser);
  app.put('/v1/users', requireAdminToken, api.registerUser);
  app.post('/v1/users', requireUserToken, api.updateUsers);

  app.delete('/v1/:collection/:itemId', requireUserToken, api.deleteItem);
  app.get('/v1/:collection/:itemId', verifyUserToken, api.getItem);
  app.post('/v1/:collection/:itemId', requireUserToken, api.updateItem);
  app.put('/v1/:collection/:itemId', requireUserToken, api.upsertItem);

  app.delete('/v1/:collection', requireUserToken, api.deleteFromCollection);
  app.get('/v1/:collection', requireUserToken, api.getFromCollection);
  app.post('/v1/:collection', requireUserToken, api.updateCollectionItems);
  app.put('/v1/:collection', requireUserToken, api.upsertToCollection);

};
