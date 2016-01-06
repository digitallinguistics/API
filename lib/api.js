// deletes items from a collection
exports.deleteFromCollection = function (req, res) {
  res.render('test', { test: 'Deleting items from collection.' });
};

// deletes a single item
exports.deleteItem = function (req, res) {
  res.render('test', { test: 'Deleting item.' });
};

// deletes a lexicon entry
exports.deleteLexEntry = function (req, res) {
  res.render('test', { test: 'Deleting lexicon entry.' });
};

// 404 error response in JSON or HTML
exports.error404 = function (req, res) {
  res.format({
    'application/json': function () {
      res.status(404);
      res.json({
        code: 404,
        message: 'Not found. The request format may be invalid. The request headers or authorization may not be properly set, or the request URL may not be formatted incorrectly. The URL you requested was: ' + req.protocol + req.host + req.originalUrl
      });
    },

    'text/html': function () {
      res.render('404');
    }
  });
};

// 500 error response in JSON or HTML
exports.error500 = function (err, req, res, next) {
  res.format({
    'application/json': function () {
      res.status(500);
      res.json({
        code: 500,
        message: 'Internal server error.'
      });
    },

    'text/html': function () {
      res.render('500');
    }
  });

  next();
};

// retrieves an item from a bundle
exports.getBundleItem = function (req, res) {
  res.render('test', { test: 'Getting item from bundle.' });
};

// retrieves items from a collection
exports.getFromCollection = function (req, res) {
  res.render('test', { test: 'Getting items from collection.' });
};

// retrieves a single item from the database
exports.getItem = function (req, res) {
  res.render('test', { test: 'Retrieving item.' });
};

// retrieves a lexicon entry from a lexicon
exports.getLexEntry = function (req, res) {
  res.render('test', { test: 'Getting lexicon entry.' });
};

// retrieves a phrase from a text
exports.getPhrase = function (req, res) {
  res.render('test', { test: 'Getting phrase.' });
};

// removes an item from a bundle
exports.removeBundleItem = function (req, res) {
  res.render('test', { test: 'Deleting item from bundle.' });
};

// updates permissions or associated resources for a bundle item
exports.updateBundleItem = function (req, res) {
  res.render('test', { test: 'Updating bundle item.' });
};

// updates permissions or associated resources for multiple items
exports.updateCollectionItems = function (req, res) {
  res.render('test', { test: 'Updating items in the collection.' });
};

// upserts an item to a bundle (and saves it to the appropriate collection)
exports.upsertBundleItem = function (req, res) {
  res.render('test', { test: 'Upserting bundle item.' });
};

// updates permissions or associated resources for an item
exports.updateItem = function (req, res) {
  res.render('test', { test: 'Updating item.' });
};

// upserts an item to a collection
exports.upsertItem = function (req, res) {
  res.render('test', { test: 'Upserting item.' });
};

exports.upsertLexEntry = function (req, res) {
  res.render('test', { test: 'Upserting lexicon entry.' });
};

// upserts items to the collection
exports.upsertToCollection = function (req, res) {
  res.render('test', { test: 'Upserting items to collection.' });
};
