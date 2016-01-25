const auth = require('./auth');
const db = require('./db');

/**
 * Strips a DocumentDB object of its metadata fields so as not to expose them to the end user client.
 * @param {object} dbObj            A DocumentDB document object.
 * @returns {object}                Returns the DocumentDB object without its metadata properties.
 */
const strip = dbObj => {
  delete dbObj._rid;
  delete dbObj._attachments;
  delete dbObj._etag;
  delete dbObj._self;
  delete dbObj._ts;
  return dbObj;
};

// deletes items from a collection
exports.deleteFromCollection = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting items from collection.' });
  }
};

/**
 * DELETE /{collection}/{item}
 * Deletes an item from a collection
 */
exports.deleteItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    if (res.locals.user.isOwner(req.params.itemId)) {
      db.deleteByIds(req.params.collection, [req.params.itemId])
      .then(() => r.res(null, 204, res))
      .catch(err => r.res(err, null, res));
    } else {
      r.res('User does not have sufficient permissions for this resource.', 403, res);
    }
  }
};

// deletes a lexicon entry
exports.deleteLexEntry = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting lexicon entry.' });
  }
};

/**
 * GET /bundles/{bundleId}/items/{itemId}
 * Retrieves an item from a bundle
 */
exports.getBundleItem = (req, res) => {
  res.format({

    'text/html': () => {
      res.render('test', { test: 'Getting item from bundle.' });
    },

    'application/json': () => {}

  });
};

/**
 * GET /{collection}
 * Retrieves items from a collection
 */
exports.getFromCollection = (req, res) => {
  res.format({

    'text/html': () => {
      res.render('test', { test: 'Getting items from collection.' });
    },

    'application/json': () => {}

  });
};

/**
 * GET /{collection}/{itemId}
 * Retrieves a single item from a collection
 */
exports.getItem = (req, res) => {

  const errorHandler = err => {
    const errObj = r.convert(err);
    res.format({
      'text/html': () => res.render('error', errObj),
      'application/json': () => r.res(errObj, null, res)
    });
  };

  const successHandler = result => {
    if (result.permissions.public || (res.locals.user && res.locals.user.isViewer(result))) {
      res.format({
        'text/html': () => res.render('test', { test: JSON.stringify(strip(result), null, 2) }),
        'application/json': () => r.res(strip(result), 200, res)
      });
    } else {
      const errObj = r.json(res.locals.user ? 'User has insufficient permissions to access this resource.' : 'This is a private resource. Try logging in.', 403);
      res.format({
        'text/html': () => res.render('error', errObj),
        'application/json': () => r.res(errObj, null, res)
      });
    }
  };

  db.getById(req.params.collection, req.params.itemId)
  .then(successHandler)
  .catch(errorHandler);

};

/**
 * GET /lexicons/{lexiconId}/entries/{entryId}
 * Retrieves a lexicon entry from a lexicon
 */
exports.getLexEntry = (req, res) => {
  res.format({

    'text/html': () => {
      res.render('test', { test: 'Getting lexicon entry.' });
    },

    'application/json': () => {}

  });
};

/**
 * GET /texts/{textId}/phrases/{phraseId}
 * Retrieves a phrase from a text
 */
exports.getPhrase = (req, res) => {
  res.format({

    'text/html': () => {
      res.render('test', { test: 'Getting phrase.' });
    },

    'application/json': () => {}

  });
};

// removes an item from a bundle
exports.removeBundleItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting item from bundle.' });
  }
};

// updates permissions or associated resources for a bundle item
exports.updateBundleItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating bundle item.' });
  }
};

// updates permissions or associated resources for multiple items
exports.updateCollectionItems = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating collection items.' });
  }
};

// upserts an item to a bundle (and saves it to the appropriate collection)
exports.upsertBundleItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Adding item to bundle.' });
  }
};

// updates permissions or associated resources for an item
exports.updateItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating item.' });
  }
};

// upserts an item to a collection
exports.upsertItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting item.' });
  }
};

exports.upsertLexEntry = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting lexicon entry.' });
  }
};

/**
 * POST /{collection}
 * Upserts items to a collection
 */
exports.upsertToCollection = (req, res) => {
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
      if (isArr) { r.res(results.map(strip), 201, res); }
      else { r.res(strip(results), 201, res); }
    })
    .catch(err => r.res(err, null, res));

  }
};
