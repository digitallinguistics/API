const auth = require('./auth');
const db = require('./db');

const jsonError = (err, res) => res.status(500).json({
  status: 500,
  error: 'Internal server error. Open an issue: https://github.com/digitallinguistics/dlx-api/issues',
  error_description: err
});

const unAuthError = res => res.status(403).json({
  status: 403,
  error: 'Unauthorized.',
  error_description: 'User does not have sufficient permissions for this resource.'
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
  }
};

/**
 * DELETE {collection}/{item}
 * Deletes an item from a collection
 */
exports.deleteItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    if (res.locals.user.isOwner(req.params.itemId)) {
      db.deleteByIds(req.params.collection, [req.params.itemId])
      .then(() => res.status(204).json({ status: 204, data: 'Delete operation successful.' }))
      .catch(err => jsonError(err, res));
    } else {
      unAuthError(res);
    }
  }
};

// deletes a lexicon entry
exports.deleteLexEntry = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting lexicon entry.' });
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
  }
};

// updates permissions or associated resources for a bundle item
exports.updateBundleItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating bundle item.' });
  }
};

// updates permissions or associated resources for multiple items
exports.updateCollectionItems = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating collection items.' });
  }
};

// upserts an item to a bundle (and saves it to the appropriate collection)
exports.upsertBundleItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Adding item to bundle.' });
  }
};

// updates permissions or associated resources for an item
exports.updateItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating item.' });
  }
};

// upserts an item to a collection
exports.upsertItem = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting item.' });
  }
};

exports.upsertLexEntry = function (req, res) {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting lexicon entry.' });
  }
};

/**
 * POST /{collection}
 * Upserts items to a collection
 */
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
      if (isArr) { res.status(201).json(results.map(strip)); }
      else { res.status(201).json(strip(results)); }
    })
    .catch(err => jsonError(err, res));

  }
};
