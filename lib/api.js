const db = require('./db');
const qs = require('querystring');
const User = require('./models/user');
const uuid = require('uuid');

const authRequests = [];

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
 * DELETE /apps
 * Deletes the specified applications.
 * @param ids               The IDs of the applications to delete.
 */
exports.deleteApps = (req, res) => {
  // TODO: check auth, delete, then update user permissions
  // (no need to check user permissions because the requesting user will always be a DLx component.)
  res.status(204).json({ status: 204, data: 'App successfully deleted.' });
};

/**
 * DELETE /{collection}
 * Deletes items from a collection.
 * @param collection          The collection to delete from.
 * @param req.query.ids       The IDs to delete.
 */
exports.deleteFromCollection = (req, res) => {
  // TODO: check auth, check user permissions, delete, then update user permissions and other associated resources
  res.status(200).json({ status: 200, data: 'Deleting from collection.' });
};

/**
 * DELETE /{collection}/{itemId}
 * Deletes an item from a collection
 * @param collection        The collection to delete from.
 * @param itemId            The ID of the item to delete.
 */
exports.deleteItem = (req, res) => {
  // TODO: check auth, check user permissions, delete, then update user permissions and other associated resources
  res.status(204).json({ status: 204, data: 'Delete operation successful.' });
};

/**
 * DELETE /lexicons/{lexiconId}/entries/{entryId}
 * Deletes a lexicon entry.
 * @param lexiconId           The ID of the lexicon to delete from.
 * @param entryId             The ID of the lexicon entry to delete.
 */
exports.deleteLexEntry = (req, res) => {
  // TODO: check auth, check user permissions, delete, then update user permissions and associated lexicons
  res.status(204).json({ status: 204, data: 'Deleting lexicon entry.' });
};

/**
 * DELETE /users/{userId}
 * @param userId                        The RID (NOT the ID/Email of the user to delete)
 */
exports.deleteUser = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else {
    // TODO: update / delete associated resources
    db.delete('users', req.params.userId)
    .then(() => r.res('Delete operation successful.', 204, res))
    .catch(err => r.res(err, null, res));
  }
};

/**
 * GET /apps
 * Retrieves the specified applications
 * @param IDs               A comma-separated list of IDs for the applications to retrieve
 */
exports.getApps = (req, res) => {
  // TODO: check auth, then retrieve applications
  res.status(200).json({ status: 200, data: 'Retrieving applications.' });
};

/**
 * GET /bundles/{bundleId}/items/{itemId}
 * Retrieves an item from a bundle.
 * @param bundleId          The bundle to retrieve the item from.
 * @param itemId            The ID of the item to retrieve.
 * @returns                 Returns either HTML or JSON depending on the `Accept` header (defaults to HTML).
 */
exports.getBundleItem = (req, res) => {
  // TODO: check for public status, then check user permissions, then return by appropriate format
  // (mimic exports.getItem())
  res.format({
    'text/html': () => { res.render('test', { test: 'Getting item from bundle.' }); },
    'application/json': () => {}
  });
};

/**
 * GET /{collection}
 * Retrieves items from a collection.
 * @param collection              The collection to retrieve the items from.
 * @param req.query.ids           The IDs of the items to retrieve.
 * @returns                       Returns either HTML or JSON depending on the `Accept` header (defaults to HTML).
 */
exports.getFromCollection = (req, res) => {
  // TODO: check for public status, then check user permissions, then return by appropriate format
  // (mimic exports.getItem())
  res.format({
    'text/html': () => { res.render('test', { test: 'Getting items from collection.' }); },
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
        'text/html': () => res.render('test', { test: JSON.stringify(db.strip(result), null, 2) }),
        'application/json': () => r.res(db.strip(result), 200, res)
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
  // TODO: check for public status, then check user permissions, then return by appropriate format
  // (mimic exports.getItem())
  res.format({
    'text/html': () => { res.render('test', { test: 'Getting lexicon entry.' }); },
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
  // TODO: check for public status, then check user permissions, then return by appropriate format
  // (mimic exports.getItem())
  res.format({
    'text/html': () => { res.render('test', { test: 'Getting phrase.' }); },
    'application/json': () => {}
  });
};

/**
 * GET /users/{userId}
 * Retrieves a user
 * @param id_type       The type of ID being provided: <code>rid</code>, <code>email</code>, or <code>service_id</code>. Defaults to <code>rid</code>.
 * @param userId        The ID of the user to retrieve.
 */
exports.getUser = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else if (req.params.id_type === 'service_id') {
    // TODO: get user by service ID
    res.status(200).json({ status: 200, data: 'Getting user by service ID.' });
  } else if (req.params.id_type === 'email') {
    // TODO: get user by email
    res.status(200).json({ status: 200, data: 'Geting user by ID/Email.' });
  } else {
    // TODO: get user by rid
    res.status(200).json({ status: 200, data: 'Getting user by RID.' });
  }
};

/**
 * PUT /apps
 * Adds a new applications to the database.
 * @returns {object}     Returns the new application object.
 */
exports.registerApp = (req, res) => {
  // TODO: check auth, then create app
  res.status(201).json({ status: 201, data: 'Application successfully created.' });
};

/**
 * PUT /users
 * Adds a new user to the database.
 * @returns {object}     Returns the new User object.
 */
exports.registerUser = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else {
    // TODO: create user
    res.status(201).json({ status: 201, data: 'User registration successful.' });
  }
};

/**
 * DELETE /bundles/{bundleId}/items/{itemId}
 * Removes an item from a bundle
 * @param bundleId            The ID of the bundle to remove items from.
 * @param itemId              The ID of the item to remove from the bundle.
 */
exports.removeBundleItem = (req, res) => {
  // TODO: check auth status, check permissions, delete, then update user permissions (and other associated resources)
  res.status(204).json({ status: 204, data: 'Item successfully removed from bundle.' });
};

/**
 * POST /apps/{appId}
 * Updates a registered application.
 * @param appId                       The ID of the app to update.
 * @param [req.query.operation]       The type of operation to perform on the item (addX, removeX).
 * @param [req.query.permission]      The permission type to add/remove.
 * @param [req.query.users]           A comma-separated list of IDs for users to add/remove permissions for.
 */
exports.updateApp = (req, res) => {
  // TODO: check auth, update app, then update user permissions and other asssociated resources.
  // (no need to check user permissions because the request will always come from a DLx component)
  res.status(200).json({ status: 200, data: 'Application successfully updated.' });
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
  // TODO: check auth status, check permissions, delete, then update user permissions (and other associated resources)
  res.status(200).json({ status: 200, data: 'Bundle item updated.' });
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
  // TODO: check auth status, check permissions, delete, then update user permissions (and other associated resources)
  res.status(200).json({ status: 200, data: 'Items successfully updated.' });
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
  // TODO: check auth status, check permissions on item, then update
  res.status(200).json({ status: 200, dat: 'Item successfully updated.' });
};

/**
 * POST /users/{userId}
 * @param userId                    The ID/Email of the user to update.
 * @param [req.query.operation]     The operation to perform on this user. If none is specified, simply upserts new information.
 */
exports.updateUser = (req, res) => {
  if (req.authStatus !== 'valid') {
    r.res('invalid_request', 401, res);
  } else if (!req.query.operation) {
    if (req.body.id !== req.params.userId) {
      r.res('The user ID in the request URL and the request body do not match.', 400, res);
    } else {
      const user = new User(req.body);
      db.upsert('users', user)
      .then(() => r.res(user, 201, res))
      .catch(err => r.res(err, null, res));
    }
  }
};

/**
 * POST /users
 * Updates permissions or associated resources for the specified users.
 * @param [req.query.operation]      The type of operation to perform on the item (addX, removeX).
 * @param [req.query.permission]     The permission type to add/remove.
 * @param [req.query.resources]      A comma-separated list of IDs for resources to associate/disassociate with the item.
 * @param [req.query.users]          A comma-separated list of IDs for users to add/remove permissions for.
 */
exports.updateUsers = (req, res) => {
  // TODO: check auth, check permissions, then update users
  res.status(200).json({ status: 200, data: 'Successfully updated users.' });
};

/**
 * PUT /bundles/{bundleId}
 * Upserts an item to a bundle (and saves it to the appropriate collection)
 * @param bundleId          The ID of the bundle to upsert items to.
 */
exports.upsertBundleItem = (req, res) => {
  // TODO: check auth status, check permissions on bundle, upsert, then update user permissions
  res.status(201).json({ status: 201, data: 'Items successfully added to bundle.' });
};

/**
 * PUT /{collection}/{itemId}
 * Upserts an item to a collection
 * @param collection          The collection to upsert the item to.
 * @param itemId              The ID of the item to be upserted/updated/overwritten.
 */
exports.upsertItem = (req, res) => {
  // TODO: check auth, check permissions on item (if it exists), upsert, then update user permissions
  res.status(201).json({ status: 201, data: 'Item successfully upserted.' });
};

/**
 * PUT /lexicons/{lexiconId}/entries/{entryId}
 * Upserts a lexicon entry to a lexicon
 * @param lexiconId           The ID of the lexicon to upsert the entry to.
 * @param entryId             The ID of the entry to upsert/update/overwrite.
 */
exports.upsertLexEntry = (req, res) => {
  // TODO: check auth, check permissions on lexicon / lexEntry (if they exist), upsert, then update user permissions
  res.status(201).json({ status: 201, data: 'Lexicon entry successfully upserted.' });
};

/**
 * PUT /{collection}
 * Upserts items to a collection
 * @param collection          The collection to upsert items to.
 */
exports.upsertToCollection = (req, res) => {
  // TODO: check auth, check permissions on items (if they exist), upsert, then update user permissions
  res.status(201).json({ status: 201, data: 'Successfully upserted items to collection.' });
};
