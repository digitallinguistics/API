var api = require('./api');
var auth = require('./auth');
var handlers = require('./handlers');

module.exports = function (app) {

  // website pages
  app.get('/', handlers.home); // homepage
  app.get('/account', handlers.account); // account page
  app.get('/developer', handlers.developer); // developer page
  app.get('/docs', handlers.docs); // documentation overview page
  app.get('/docs/:doc', handlers.docs); // individual documentation page
  app.get('/login', handlers.login); // login page
  app.get('/register', handlers.register); // register new user
  app.get('/test', handlers.test); // testing and debugging

  app.post('/account', handlers.account);
  app.post('/developer', handlers.developer);
  app.post('/register', handlers.register);

  // authentication
  app.get('/auth', auth.grant); // handling client implicit grant requests
  app.get('/oauth/:service', auth.oauth); // handling OAuth response from services

  // API endpoints
  app.delete('/v1/:collection', api.deleteFromCollection);
  app.get('/v1/:collection', api.getFromCollection);
  app.post('/v1/:collection', api.updateCollectionItems);
  app.put('/v1/:collection', api.upsertToCollection);

  app.delete('/v1/:collection/:itemId', api.deleteItem);
  app.get('/v1/:collection/:itemId', api.getItem);
  app.post('/v1/:collection/:itemId', api.updateItem);
  app.put('/v1/:collection/:itemId', api.upsertItem);

  app.delete('/v1/bundles/:bundleId/items/:itemId', api.removeBundleItem);
  app.get('/v1/bundles/:bundleId/items/:itemId', api.getBundleItem);
  app.post('/v1/bundles/:bundleId/items/:itemId', api.updateBundleItem);
  app.put('/v1/bundles/:bundleId/items/:itemId', api.upsertBundleItem);

  app.delete('/v1/lexicons/:lexiconId/entries/entryId', api.deleteLexEntry);
  app.get('/v1/lexicons/:lexiconId/entries/:entryId', api.getLexEntry);
  app.put('/v1/lexicons/:lexiconId/entries/:entryId', api.upsertLexEntry);

  app.get('/v1/texts/:textId/phrases/:phraseId', api.getPhrase);
};
