var api = require('./api');
var handlers = require('./handlers');

module.exports = function (app) {

  // website pages
  app.get('/', handlers.home); // homepage
  app.get('/account', handlers.account); // account page
  app.get('/developer', handlers.developer); // developer page
  app.get('/developer/register', handlers.developer); // app registration page
  app.get('/docs', handlers.docs); // documentation overview page
  app.get('/docs/:doc', handlers.docs); // individual documentation page
  app.get('/login', handlers.account); // login page
  app.get('/register', handlers.account); // register new user
  app.get('/test', handlers.test); // testing and debugging

  // API auth endpoints
  app.get('/auth', api.auth); // handling client implicit grant requests

  // API methods
  app.delete('/v1/:collection', api.deleteFromCollection);
  app.get('/v1/:collection', api.getFromCollection);
  app.put('/v1/:collection', api.upsertToCollection);

  app.delete('/v1/:collection/:itemID', api.deleteItem);
  app.get('/v1/:collection/:itemID', api.getItem);
  app.post('/v1/:collection/:itemID', api.updateItem);

  app.get('/v1/bundles/:bundleID/items/:itemID', api.getBundleItem);
  app.get('/v1/lexicons/:lexiconID/entries/:entryID', api.getLexEntry);
  app.get('/v1/texts/:textID/phrases/:phraseID', api.getPhrase);
};
