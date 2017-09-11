const config        = require('./config');
const dlx           = require('./dlx');
const documentdb    = require('documentdb');
const { promisify } = require('util');
const uuid          = require('uuid/v4');

const {
  parents,
  permissions,
} = require('./utilities');

const {
  addPermissions,
  isContributor,
} = permissions;

// Constants
const coll               = `dbs/dlx/colls/items`; // collection URL
const continuationHeader = `x-ms-continuation`;   // continuation header

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbURL, { masterKey: config.dbKey });

// arguments: data, options
const createDocument = (...args) => new Promise((resolve, reject) => {
  db.createDocument(coll, ...args, (err, res, headers) => {
    if (err) reject(err);
    else resolve({ res, headers });
  });
});

// arguments: id, userID, options
const deleteDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/destroy`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ res, headers });
  });
});

// arguments: id, userID, options
const readDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/get`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ res, headers });
  });
});

// arguments: data, userID, options
const updateDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/update`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ res, headers });
  });
});

// arguments: data, userID, options
const upsertDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/upsert`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ res, headers });
  });
});


// UTILITIES
const hydrate = (data, Model = dlx.models[data.type]) => {

  if (typeof Model === `undefined`) {
    const err = new RangeError(`Invalid type.`);
    err.status = 400;
  }

  let model;

  try {
    model = new Model(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status = 422;
    throw err;
  }

  if (!model.id) model.id = uuid();

  if (!model.url) model.setURL();

  return model;

};

const makeRequest = async (operation, ...args) => {

  try {

    const { res, headers = {} } = await operation(...args);
    if (headers[continuationHeader]) res.continuation = headers[continuationHeader];
    return res;

  } catch (err) {

    if (config.logErrors) console.error(err);

    const props = {};
    const id    = args[0] instanceof Object ? args[0].id : args[0];

    // retry the request after the given timeout
    const retry = timeout => new Promise((resolve, reject) => setTimeout(() => makeRequest(operation, args).then(resolve).catch(reject), timeout));

    // use err.substatus for 400 responses, if present, and err.code otherwise
    let status  = err.code === 400 && err.substatus ? err.substatus : err.code || 500;
    let message = `There was an error performing the database operation.`;

    switch (status) {
      case 400:
      case 401:
      {

        // treat 400 and 401 responses from CosmosDB as 500 errors
        // requests from DLx server to CosmosDB should always
        // be correctly formatted and handle exceptions

        if (config.logErrors) console.error(`FIXME: 400 response received from CosmosDB. See details above.`);

        if (err.body.includes(`Continuation`)) {
          status = 400;
          message = `Invalid continuation token.`;
        } else {
          status = 500;
        }

        break;

      }
      case 403: {
        message = `The client or user has insufficient permissions to access the resource with ID ${id}.`;
        break;
      }
      case 404: {
        message = `Resource with ID ${id} could not be found.`;
        break;
      }
      case 408: {
        if (id) message = `Timeout performing database operation on resource with ID ${id}.`;
        else message = `Timeout performing database operation.`;
        break;
      }
      case 409: {
        message = `Resource with ID ${id} already exists.`;
        break;
      }
      case 410: {
        message = `Resource with ID ${id} no longer exists.`;
        break;
      }
      case 412: {
        message = `Precondition not met for operation on resource with ID ${id}.`;
        break;
      }
      case 413: {
        if (id) message = `Resource with ID ${id} is too large.`;
        else message = `The resource provided for this operation is too large.`;
        break;
      }
      case 429: {
        // retry operation after wait time if request is throttled
        return retry(err.retryAfterInMilliseconds);
      }
      case 449: {
        // retry the operation as before
        return retry(1000);
      }
      case 503: {
        message = `The database service is unavailable. Please retry again later.`;
        break;
      }
      default: {
        break;
      }
    }

    const e = new Error(message);
    e.status = status;
    Object.assign(e, props);
    throw e;

  }

};

const scrub = (model, userID) => {
  if (model.anonymize && !isContributor(model, userID)) model.anonymize();
  Reflect.deleteProperty(model, `_attachments`);
  Reflect.deleteProperty(model, `_rid`);
  Reflect.deleteProperty(model, `_self`);
  Reflect.deleteProperty(model, `permissions`);
  return model;
};


// EXPORTED CRUD METHODS
const create = async (data = {}, userID, type) => {
  const Model = dlx.models[type];
  const model = addPermissions(hydrate(data, Model));
  model.permissions.owners.push(userID);
  Reflect.deleteProperty(model, `id`); // don't let users set their own ID
  const doc = await makeRequest(createDocument, model);
  return scrub(hydrate(doc, Model), userID);
};

const destroy = (id, userID, options = {}) => makeRequest(deleteDocument, id, userID, options);

const get = async (id, userID, options = {}) => {
  const doc = await makeRequest(readDocument, id, userID, options);
  return scrub(hydrate(doc), userID);
};

const getAll = async (userID, type, options) => {

  const {
    continuation,
    ifModifiedSince,
    maxItemCount,
    parentID,
    public: pub,
  } = options;

  if (continuation && typeof continuation !== `string`) {
    const e = new Error(`The dlx-continuation header must be a String.`);
    e.status = 400;
    throw e;
  }

  if (maxItemCount && !Number.isInteger(Number(maxItemCount))) {
    const e = new Error(`The dlx-max-item-count header must be an Integer.`);
    e.status = 400;
    throw e;
  }

  const publicQuery = `
    c.permissions.public = true
    OR
  `;

  const permissionsQuery = `
    -- User has view permissions
    AND (
      ${pub ? publicQuery : ''}
      ARRAY_CONTAINS(c.permissions.viewers, "${userID}")      -- User is viewer
      OR
      ARRAY_CONTAINS(c.permissions.contributors, "${userID}") -- User is contributor
      OR
      ARRAY_CONTAINS(c.permissions.owners, "${userID}")       -- User is owner
    )
  `;

  const lastModifiedQuery = `
    -- Has been modified after the value of If-Modified-Since
    AND c._ts >= ${Math.floor(new Date(ifModifiedSince || null) / 1000)}
  `;

  const subItemQuery = `
    -- Has the specified parent item
    AND c.${parents[type] ? parents[type].toLowerCase() : ''}ID = "${parentID}"
  `;

  const query = `
    SELECT * FROM items c
    WHERE
      -- Has correct type
      c.type = "${type}"

      -- TTL is not set
      AND (NOT IS_DEFINED(c.ttl))

      ${parentID ? subItemQuery : ''}
      ${userID ? permissionsQuery : 'AND c.public = true'}
      ${ifModifiedSince ? lastModifiedQuery : ''}
  `;

  const queryIterator = db.queryDocuments(coll, query, options);

  const executeNext = () => new Promise((resolve, reject) => {
    queryIterator.executeNext((err, res, headers) => {
      if (err) reject(err);
      else resolve({ headers, res });
    });
  });

  const toArray = () => new Promise((resolve, reject) => {
    queryIterator.toArray((err, res) => {
      if (err) reject(err);
      else resolve({ res });
    });
  });

  let docs = [];

  if (options.maxItemCount) docs = await makeRequest(executeNext);
  else docs = await makeRequest(toArray);

  const response = docs.map(doc => scrub(hydrate(doc), userID));
  if (docs.continuation) response.continuation = docs.continuation;
  return response;

};

const update = async (data = {}, userID, options = {}) => {
  hydrate(data); // do not pass model to update - it will overwrite properties that it shouldn't
  const doc = await makeRequest(updateDocument, data, userID, options);
  return scrub(hydrate(doc), userID);
};

const upsert = async (data = {}, userID, options = {}) => {
  if (!data.id) return create(data, userID, data.type);
  const model = hydrate(data);
  const doc   = await makeRequest(upsertDocument, model, userID, options);
  return scrub(hydrate(doc), userID);
};

// TYPE-SPECIFIC METHODS

const deleteLanguage = async (languageID, userID, options = {}) => {

  // delete all Lexemes for that Language
  const query = `
    SELECT * FROM items c
    WHERE
      c.type = "Lexeme"
      AND c.languageID = "${languageID}"
  `;

  const iterator = db.queryDocuments(coll, query);
  const toArray  = promisify(iterator.toArray).bind(iterator);
  const lexemes  = await toArray();

  // delete Lexemes sequentially
  lexemes.reduce((p, lex) => makeRequest(deleteDocument, lex.id, userID), Promise.resolve());

  // delete the Language
  return makeRequest(deleteDocument, languageID, userID, options);

};

module.exports = {

  client:  db,
  coll,
  create,
  delete:  destroy,
  destroy,
  get,
  getAll,
  update,
  upsert,

  deleteLanguage,

};
