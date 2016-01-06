var api = require('./api');
var auth = require('./auth');
var handlers = require('./handlers');

module.exports = function (app) {

  // website pages
  app.get('/', handlers.home); // homepage
  app.get('/account', handlers.account); // account page
  app.get('/developer', handlers.developer); // developer page
  app.get('/developer/register', handlers.devRegistration); // app registration page
  app.get('/docs', handlers.docs); // documentation overview page
  app.get('/docs/:doc', handlers.docs); // individual documentation page
  app.get('/login', handlers.account); // login page
  app.get('/register', handlers.account); // register new user
  app.get('/test', handlers.test); // testing and debugging

  // authentication
  app.get('/auth', auth.grant); // handling client implicit grant requests

  // API endpoints
  app.delete('/v1/:collection', api.deleteFromCollection);
  app.get('/v1/:collection', api.getFromCollection);
  app.post('/v1/:collection', api.updateCollectionItems);
  app.put('/v1/:collection', api.upsertToCollection);

  app.delete('/v1/:collection/:itemID', api.deleteItem);
  app.get('/v1/:collection/:itemID', api.getItem);
  app.post('/v1/:collection/:itemID', api.updateItem);
  app.put('/v1/:collection/:itemID', api.upsertItem);

  app.delete('/v1/bundles/:bundleID/items/:itemID', api.removeBundleItem);
  app.get('/v1/bundles/:bundleID/items/:itemID', api.getBundleItem);
  app.post('/v1/bundles/:bundleID/items/:itemID', api.updateBundleItem);
  app.put('/v1/bundles/:bundleID/items/:itemID', api.upsertBundleItem);

  app.delete('/v1/lexicons/:lexiconID/entries/entryID', api.deleteLexEntry);
  app.get('/v1/lexicons/:lexiconID/entries/:entryID', api.getLexEntry);
  app.put('/v1/lexicons/:lexiconID/entries/:entryID', api.upsertLexEntry);

  app.get('/v1/texts/:textID/phrases/:phraseID', api.getPhrase);
};
