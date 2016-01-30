const db = require('./db');
const qs = require('querystring');
const User = require('./models/user');
const uuid = require('uuid');

const authRequests = [];

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

/**
 * Handles Implicit Grant authorization requests.
 */
exports.auth = (req, res) => {
  if (!req.query.client_id) { r.res('Please include a `client_id` parameter in the querystring.', 400, res); }
  else if (!req.query.redirect_uri) { r.res('Please include a `redirect_uri` parameter in the querystring.', 400, res); }
  else if (req.query.response_type !== 'token') { r.res('Please inlcude a `response_type` parameter in the querystring, with a value of `token`.', 400, res); }
  else {
    db.getAppById(req.query.client_id)
    .then(() => {

      const authReq = {
        client: req.query.client_id,
        redirect: req.query.redirect,
        state: req.query.state || uuid.v4()
      };

      authRequests.push(authReq);

      const params = {
        redirect: 'https://api.digitallinguistics.org/oauth',
        state: authReq.state
      };

      res.redirect('https://digitallinguistics.org/login?' + qs.stringify(params));

    })
    .catch(err => r.res(err, null, res));
  }
};

/**
 * DELETE /{collection}
 * Deletes items from a collection.
 * @param collection          The collection to delete from.
 * @param req.query.ids       The IDs to delete.
 */
// TODO: Check that this works on production
exports.deleteFromCollection = (req, res) => {
  if (auth.checkToken(req, res)) {
    db.deleteByIds(req.params.collection, req.query.ids)
    .then(result => res.json(result))
    .catch(err => res.json(err));
  }
};

/**
 * DELETE /{collection}/{itemId}
 * Deletes an item from a collection
 * @param collection        The collection to delete from.
 * @param itemId            The ID of the item to delete.
 */
// TODO: Check that this works on production
exports.deleteItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    if (res.locals.user.isOwner(req.params.itemId)) {
      db.deleteByIds(req.params.collection, [req.params.itemId])
      .then(() => r.res(null, 204, res))
      .catch(err => r.res(err, null, res));
    } else {
      r.res('User does not have permission to delete this resource.', 403, res);
    }
  }
};

/**
 * DELETE /lexicons/{lexiconId}/entries/{entryId}
 * Deletes a lexicon entry.
 * @param lexiconId           The ID of the lexicon to delete from.
 * @param entryId             The ID of the lexicon entry to delete.
 */
exports.deleteLexEntry = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting lexicon entry.' });
  }
};

exports.deleteUser = (req, res) => {};

/**
 * GET /bundles/{bundleId}/items/{itemId}
 * Retrieves an item from a bundle
 * @param bundleId          The bundle to retrieve the item from.
 * @param itemId            The ID of the item to retrieve.
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
 * @param collection              The collection to retrieve the items from.
 * @param req.query.ids           The IDs of the items to retrieve.
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
 * @param collection          The collection to retrieve the item from.
 * @param itemId              The ID of the item to retrieve.
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
      const errObj = r.json(res.locals.user ? 'User has insufficient permissions to access this resource.' : 'This is a private resource. Try logging in, and be sure that cookies are enabled.', 403);
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
 * @param lexiconId             The ID of the lexicon to retrieve entries from.
 * @param entryId               The ID of the lexicon entry to retrieve.
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
 * @param {textId}        The ID of the text to retrieve phrases from.
 * @param phraseId        The ID of the phrase to retrieve.
 */
exports.getPhrase = (req, res) => {
  res.format({

    'text/html': () => {
      res.render('test', { test: 'Getting phrase.' });
    },

    'application/json': () => {}

  });
};

exports.getUser = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else {
    db.getUser(req.params.userId)
    .then(user => r.res(user, 200, res))
    .catch(err => r.res(err, null, res));
  }
};

exports.getUserByServiceId = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else if (!req.query.id) {
    r.res('Please provide an `id` parameter.', 400, res);
  } else if (!req.query.service) {
    r.res('Please provide a `service` parameter.', 400, res);
  } else {
    db.getUserById(req.query.id, req.query.service)
    .then(user => r.res(user, 200, res))
    .catch(err => r.res(err, null, res));
  }
};

/**
 * PUT /users
 * Adds a new user to the database
 * @return {object}     Returns the new User object.
 */
exports.registerUser = (req, res) => {
  if (req.authStatus === 'valid') {
    db.registerUser(req.body)
    .then(user => r.res(user, 201, res))
    .catch(err => r.res(err, null, res));
  } else {
    r.res('invalid_request', 401, res);
  }
};

/**
 * DELETE /bundles/{bundleId}/items/{itemId}
 * Removes an item from a bundle
 * @param bundleId            The ID of the bundle to remove items from.
 * @param itemId              The ID of the item to remove from the bundle.
 */
exports.removeBundleItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Deleting item from bundle.' });
  }
};

/**
 * POST /bundles/{bundleId}/items/{itemId}
 * Updates permissions or associated resources for a bundle item
 * @param bundleId          The ID of the bundle to update items for.
 * @param itemId            The ID of the bundle item to update.
 * @param [req.query.operation]      The type of operation to perform on the item (addX, removeX).
 * @param [req.query.permission]     The permission type to add/remove.
 * @param [req.query.resources]      A comma-separated list of IDs for resources to associate/disassociate with the item.
 * @param [req.query.users]          A comma-separated list of IDs for users to add/remove permissions for.
 */
exports.updateBundleItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating bundle item.' });
  }
};

/**
 * POST /{collection}
 * Updates permissions or associated resources for multiple items in a collection
 * @param collection            The collection to update items for.
 * @param ids                   The IDs of the items to update.
 * @param [req.query.operation]      The type of operation to perform on the item (addX, removeX).
 * @param [req.query.permission]     The permission type to add/remove.
 * @param [req.query.resources]      A comma-separated list of IDs for resources to associate/disassociate with the item.
 * @param [req.query.users]          A comma-separated list of IDs for users to add/remove permissions for.
 */
exports.updateCollectionItems = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating collection items.' });
  }
};

/**
 * PUT /bundles/{bundleId}
 * Upserts an item to a bundle (and saves it to the appropriate collection)
 * @param bundleId          The ID of the bundle to upsert items to.
 */
exports.upsertBundleItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Adding item to bundle.' });
  }
};

/**
 * POST /{collection}/{itemId}
 * Updates permissions or associated resources for an item
 * @param collection            The collection for the item to update.
 * @param itemId                The ID of the item to update.
 * @param [req.query.operation]      The type of operation to perform on the item (addX, removeX).
 * @param [req.query.permission]     The permission type to add/remove.
 * @param [req.query.resources]      A comma-separated list of IDs for resources to associate/disassociate with the item.
 * @param [req.query.users]          A comma-separated list of IDs for users to add/remove permissions for.
 */
exports.updateItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Updating item.' });
  }
};

/**
 * POST /users/{userRid}
 * @param userId                    The RID of the user to update. (Technically not needed - the upsert will go by the ID of the user object in the request body.)
 * @param [req.query.operation]     The operation to perform on this user. If none is specified, simply upserts new information.
 */
exports.updateUser = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else if (!req.query.operation) {
    const user = new User(req.body);
    db.upsert('users', user)
    .then(() => r.res(user, 201, res))
    .catch(err => r.res(err, null, res));
  }
};

exports.updateUsers = (req, res) => {};

/**
 * PUT /{collection}/{itemId}
 * Upserts an item to a collection
 * @param collection          The collection to upsert the item to.
 * @param itemId              The ID of the item to be upserted/updated/overwritten.
 */
exports.upsertItem = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting item.' });
  }
};

/**
 * PUT /lexicons/{lexiconId}/entries/{entryId}
 * Upserts a lexicon entry to a lexicon
 * @param lexiconId           The ID of the lexicon to upsert the entry to.
 * @param entryId             The ID of the entry to upsert/update/overwrite.
 */
exports.upsertLexEntry = (req, res) => {
  if (auth.checkToken(req, res)) {
    res.render('test', { test: 'Upserting lexicon entry.' });
  }
};

/**
 * PUT /{collection}
 * Upserts items to a collection
 * @param collection          The collection to upsert items to.
 */
exports.upsertToCollection = (req, res) => {
  if (auth.checkToken(req, res)) {

    var isArr = req.body instanceof Array;
    const user = res.locals.user;

    const updateUser = results => new Promise((resolve, reject) => {
      if (isArr) { results.forEach(user.makeOwner); }
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
