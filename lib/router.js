var api = require('./api');

module.exports = app => {

  app.get('/auth', api.auth);

  app.post('/v1/apps/:appId', api.updateApp); // for updating app permissions
  app.post('/v1/apps', api.upsertApps);
  app.delete('/v1/apps', api.deleteApps);
  app.get('/v1/apps', api.getApps);
  app.put('/v1/apps', api.registerApp);

  app.delete('/v1/bundles/:bundleId/items/:itemId', api.removeBundleItem);
  app.get('/v1/bundles/:bundleId/items/:itemId', api.getBundleItem);
  app.post('/v1/bundles/:bundleId/items/:itemId', api.updateBundleItem);
  app.put('/v1/bundles/:bundleId/items/:itemId', api.upsertBundleItem);

  app.delete('/v1/lexicons/:lexiconId/entries/:entryId', api.deleteLexEntry);
  app.get('/v1/lexicons/:lexiconId/entries/:entryId', api.getLexEntry);
  app.put('/v1/lexicons/:lexiconId/entries/:entryId', api.upsertLexEntry);

  app.get('/v1/texts/:textId/phrases/:phraseId', api.getPhrase);

  app.delete('/v1/users/:userId', api.deleteUser);
  app.get('/v1/users/:userId', api.getUser);
  app.post('/v1/users/:userId', api.updateUser);
  app.put('/v1/users', api.registerUser);
  app.post('/v1/users', api.updateUsers);

  app.delete('/v1/:collection/:itemId', api.deleteItem);
  app.get('/v1/:collection/:itemId', api.getItem);
  app.post('/v1/:collection/:itemId', api.updateItem);
  app.put('/v1/:collection/:itemId', api.upsertItem);

  app.delete('/v1/:collection', api.deleteFromCollection);
  app.get('/v1/:collection', api.getFromCollection);
  app.post('/v1/:collection', api.updateCollectionItems);
  app.put('/v1/:collection', api.upsertToCollection);

};
