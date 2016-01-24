const auth = require('./auth');
const db = require('./db');

const jsonError = (err, res) => res.json({
  status: 500,
  error: 'Internal server error. Open an issue: https://github.com/digitallinguistics/dlx-api/issues',
  error_description: err
});

const strip = dbObj => {
  delete dbObj._rid;
  delete dbObj._attachments;
  delete dbObj._etag;
  delete dbObj._self;
  delete dbObj._ts;
  return dbObj;
};

// deletes items from a collection
exports.deleteFromCollection = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting items from collection.' });
  } else {
    jsonError('Error deleting from collection.', res);
  }
};

// deletes a single item
exports.deleteItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting item.' });
  } else {
    jsonError('Error deleting item.', res);
  }
};

// deletes a lexicon entry
exports.deleteLexEntry = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting lexicon entry.' });
  } else {
    jsonError('Error deleting lexicon entry.', res);
  }
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
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting item from bundle.' });
  } else {
    jsonError('Error removing item from bundle.', res);
  }
};

// updates permissions or associated resources for a bundle item
exports.updateBundleItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating bundle item.' });
  } else {
    jsonError('Error updating bundle item.', res);
  }
};

// updates permissions or associated resources for multiple items
exports.updateCollectionItems = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating collection items.' });
  } else {
    jsonError('Error updating collection items.', res);
  }
};

// upserts an item to a bundle (and saves it to the appropriate collection)
exports.upsertBundleItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Adding item to bundle.' });
  } else {
    jsonError('Error upserting bundle item.', res);
  }
};

// updates permissions or associated resources for an item
exports.updateItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating item.' });
  } else {
    jsonError('Error updating item.', res);
  }
};

// upserts an item to a collection
exports.upsertItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting item.' });
  } else {
    jsonError('Error upserting item.', res);
  }
};

exports.upsertLexEntry = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting lexicon entry.' });
  } else {
    jsonError('Error upserting lexicon entry.', res);
  }
};

// upserts items to the collection
exports.upsertToCollection = function (req, res) {
  if (auth.checkToken(req, res)) {

    var isArr;
    const user = res.locals.user;

    const updateUser = results => new Promise((resolve, reject) => {
      isArr = results instanceof Array;
      if (isArr) { results.forEach(item => user.makeOwner(item)); }
      else { user.makeOwner(results); }
      db.upsert('users', user).then(() => resolve(results)).catch(reject);
    });

    db.upsert(req.params.collection, req.body)
    .then(updateUser)
    .then(results => {
      if (isArr) { res.json(results.map(strip)); }
      else { res.json(strip(results)); }
    })
    .catch(jsonError);

  } else {
    jsonError('Error upserting items to collection.', res);
  }
};
