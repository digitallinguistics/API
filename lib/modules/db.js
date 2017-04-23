/* eslint-disable
  block-scoped-var
*/

const config      = require(`../config`);
const dlx         = require(`@digitallinguistics/dlx-js`);
const documentdb  = require(`documentdb`);
const permissions = require(`../utils/permissions`);

const { isContributor, isPublic, isViewer } = permissions;

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

// Collection URL
const coll            = `dbs/dlx/colls/items`;
const defaultPageSize = 1000;

// UTILITIES
const parseResponse = (err, res) => {

  if (!(err || res)) {
    const error = new Error;
    error.status = 304;
    return error;
  }

  if (!err) return;

  const patt        = /Message:.+Exception = (.+)"]}/;
  const matches     = JSON.parse(err.body).message.match(patt);

  const { code, message } = matches ? JSON.parse(matches[1].replace(/\\/g, '')) : err;

  const e = new Error;

  switch (code) {
    case 400:
    case 401:
    case 403:
      e.status = 500;
      break;
    default: e.status = code;
  }

  e.message = message;

  return e;

};

const scrub = (model, userId) => {

  Reflect.deleteProperty(model, `_attachments`);
  Reflect.deleteProperty(model, `_rid`);
  Reflect.deleteProperty(model, `_self`);
  Reflect.deleteProperty(model, `_ts`);
  Reflect.deleteProperty(model, `permissions`);

  if (!isContributor(model, userId)) {
    if (model.anonymize) model.anonymize();
  }

  return model;

};

// DOCUMENTDB METHODS
const readDoc = (id, options) => new Promise((resolve, reject) => {
  db.readDocument(`${coll}/docs/${id}`, options, (err, doc) => {

    const e = parseResponse(err, doc);
    if (e) return reject(e);

    if (doc.ttl && !doc.test) {
      const err  = new Error(`Document with ID "${id}" no longer exists.`);
      err.status = 404;
      return reject(err);
    }

    return resolve(doc);

  });
});

const queryDocs = (querySpec, { continuation, maxItemCount }) => new Promise((resolve, reject) => {

  const queryOpts = {
    continuation,
    maxItemCount: maxItemCount || defaultPageSize,
  };

  const queryIterator = db.queryDocuments(coll, querySpec, queryOpts);

  if (maxItemCount) {

    queryIterator.executeNext((err, res, headers) => {
      const e = parseResponse(err, res);
      if (e) return reject(e);
      res.continuation = headers[`x-ms-continuation`];
      resolve(res);
    });

  } else {

    queryIterator.toArray((err, res) => {
      const e = parseResponse(err, res);
      if (e) reject(e);
      else resolve(res);
    });
  }

});

const upsertDoc = (...args) => new Promise((resolve, reject) => {
  const sprocLink = `${coll}/sprocs/upsert`;
  db.executeStoredProcedure(sprocLink, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

// CRUD METHODS
const destroy = (...args) => new Promise((resolve, reject) => {
  const sprocLink = `${coll}/sprocs/destroy`;
  db.executeStoredProcedure(sprocLink, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

const destroyAll = (ids, userId) => Promise.all(ids.map(id => destroy(id, userId)));

const get = async (id, userId, Type, options = {}) => {

  const doc   = await readDoc(id, options);
  const Model = dlx.models[Type];

  try {
    var model = new Model(doc);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status = 400;
    throw err;
  }

  if (!(isPublic(model) || isViewer(model, userId))) {
    const err = new Error(`The client or user has insufficient permissions to access the resource with ID "${id}".`);
    err.status = 403;
    throw err;
  }

  return scrub(model, userId);

};

const getAll = async (ids = [], userId, Type, options) => {

  if (ids.length === 1) return get(ids[0]).then(model => [model]);

  const idsQuery = `
    -- Document ID is contained in IDs array
    AND (ARRAY_CONTAINS(@ids, d.id))
  `;

  const permissionsQuery = `
    -- User has view permissions
    AND (
      d.permissions.public = true                           -- Resource is public
      OR ARRAY_CONTAINS(d.permissions.viewer, @userId)      -- User is viewer
      OR ARRAY_CONTAINS(d.permissions.contributor, @userId) -- User is contributor
      OR ARRAY_CONTAINS(d.permissions.owner, @userId)       -- User is owner
    )
  `;

  const querySpec = {

    parameters: [
      {
        name:  `@ids`,
        value: ids,
      },
      {
        name:  `@userId`,
        value: userId,
      },
      {
        name: `@type`,
        value: Type,
      },
    ],

    query: `
      SELECT * FROM items d
      WHERE
        -- Has correct type
        d.type = @type

        -- TTL is not set
        AND (NOT IS_DEFINED(d.ttl))

        ${userId ? permissionsQuery : ''}
        ${ids.length ? idsQuery : ''}
    `,

  };

  const docs  = await queryDocs(querySpec, options);
  const Model = dlx.models[Type];

  try {
    var models  = docs.map(doc => new Model(doc));
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status = 400;
    throw err;
  }

  const response = models.map(model => scrub(model, userId));
  response.continuation = docs.continuation;
  return response;

};

const upsert = async (data = {}, userId, Type, options = {}) => {

  const Model = dlx.models[Type];

  try {
    var model = new Model(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: "${e.message}"`);
    err.status = 400;
    throw err;
  }

  const doc = await upsertDoc(model, userId, options);
  const newModel = new Model(doc);

  return scrub(newModel, userId);

};

const upsertAll = (data = [], userId, Type) => Promise.all(data.map(item => upsert(item, userId, Type)));

module.exports = {
  client:     db,
  coll,
  delete:     destroy,
  deleteAll:  destroyAll,
  destroy,
  destroyAll,
  get,
  getAll,
  upsert,
  upsertAll,
};
