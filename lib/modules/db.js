/* eslint-disable
  block-scoped-var
*/

const config      = require(`../config`);
const dlx         = require(`@digitallinguistics/dlx-js`);
const documentdb  = require(`documentdb`);
const permissions = require(`../utils/permissions`);

const { isPublic, isViewer } = permissions;

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

// Collection URL
const coll            = `dbs/dlx/colls/items`;
const defaultPageSize = 1000;

// UTILITIES
const scrub = doc => {
  Reflect.deleteProperty(doc, `_rid`);
  Reflect.deleteProperty(doc, `_self`);
  Reflect.deleteProperty(doc, `_attachments`);
  Reflect.deleteProperty(doc, `permissions`);
  return doc;
};

// DOCUMENTDB METHODS
const readDoc = id => new Promise((resolve, reject) => {
  db.readDocument(`${coll}/docs/${id}`, (err, doc) => {

    if (err) return reject(err);

    if (doc.ttl && !doc.test) {
      const err  = new Error;
      err.status = err.code = 404;
      reject(err);
    }

    resolve(doc);

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
      if (err) return reject(err);
      res.continuation = headers[`x-ms-continuation`];
      resolve(res);
    });

  } else {

    queryIterator.toArray((err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  }

});

const upsertDoc = (data = {}, userId) => new Promise((resolve, reject) => {
  const sprocLink = `${coll}/sprocs/upsert`;
  db.executeStoredProcedure(sprocLink, [data, userId], (err, res) => {
    if (err) reject(err);
    else resolve(res);
  });
});

// CRUD METHODS
const destroy = (resourceId, userId) => new Promise((resolve, reject) => {
  const sprocLink = `${coll}/sprocs/destroy`;
  db.executeStoredProcedure(sprocLink, [resourceId, userId], (err, res) => {
    if (err && err.code == 400) {
      const e = new Error(`Resource with ID "${resourceId}" could not be found.`);
      e.status = 404;
      reject(e);
    } else if (err) {
      reject(err);
    } else {
      resolve(res);
    }
  });
});

const destroyAll = (ids, userId) => Promise.all(ids.map(id => destroy(id, userId)));

const get = async (id, userId, Type) => {

  try {
    var doc = await readDoc(id);
  } catch (e) {
    const message = e.code == 404 ?
      `No resource with the ID "${id}" was found.` :
      `There was a problem retrieving the data from the database.`;
    const err = new Error(message);
    err.status = e.status || e.code || 500;
    throw err;
  }

  const Model = dlx.models[Type];

  try {
    var model = new Model(doc);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status = 400;
    throw err;
  }

  if (!(isPublic(model) || isViewer(userId))) {
    const err = new Error(`The client or user has insufficient permissions to access the resource with ID "${id}".`);
    err.status = 403;
    throw err;
  }

  return scrub(model);

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

  const response = models.map(scrub);
  response.continuation = docs.continuation;
  return response;

};

const upsert = async (data = {}, userId, Type) => {

  const Model = dlx.models[Type];

  try {
    var model = new Model(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: "${e.message}"`);
    err.status = 400;
    throw err;
  }

  try {
    var doc = await upsertDoc(model, userId);
  } catch (e) {
    const err = new Error(`There was a problem upserting the resource.`);
    err.status = e.status || e.code || 500;
    throw err;
  }

  return scrub(new Model(doc));

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
