const config      = require('./config');
const dlx         = require('@digitallinguistics/dlx-js');
const documentdb  = require('documentdb');
const permissions = require('./utils/permissions');
const uuid        = require('uuid/v4');

const { addPermissions, isContributor } = permissions;

// Collection URL
const coll = `dbs/dlx/colls/items`;

// Type > Collection
const collections = {
  Language: `languages`,
};

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

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

  if (!model.url) {
    const collection = collections[model.type];
    model.url = `https://api.digitallinguistics.io/${collection}/${model.id}`;
  }

  return model;

};

const parseResponse = err => {

  if (!err) return;

  if (config.logErrors) console.error(err);

  let message;

  if (err.substatus) {
    try {
      const patt = /Message:.+Exception = (.+)"]}/;
      message    = JSON.parse(err.body).message.match(patt)[0];
    } catch (error) {
      message = `There was an error performing the database operation.`;
    }
  }

  const e  = new Error(message);
  e.status = err.code === 400 ? err.substatus || 400 : err.code || 500;
  if (err.code === 429) e.retryAfter = err.retryAfterInMilliseconds;
  return e;

};

const scrub = (model, userId) => {
  if (model.anonymize && !isContributor(model, userId)) model.anonymize();
  Reflect.deleteProperty(model, `_attachments`);
  Reflect.deleteProperty(model, `_rid`);
  Reflect.deleteProperty(model, `_self`);
  Reflect.deleteProperty(model, `permissions`);
  return model;
};


// DOCUMENTDB CRUD METHODS

// arguments: data, options
const createDoc = (...args) => new Promise((resolve, reject) => {
  db.createDocument(coll, ...args, (err, doc) => {
    const e = parseResponse(err, doc);
    if (e && e.status == 409) e.message = `Document with ID ${args[0].id} already exists.`;
    if (e) reject(e);
    else resolve(doc);
  });
});

// arguments: id, userId, options
const deleteDoc = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/destroy`, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

// arguments: id, userId, options
const readDoc = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/get`, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

const queryDocs = (querySpec, { continuation, maxItemCount }) => new Promise((resolve, reject) => {

  const queryIterator = db.queryDocuments(coll, querySpec, {
    continuation,
    maxItemCount: Number(maxItemCount),
  });

  if (maxItemCount) {

    queryIterator.executeNext((err, res, headers) => {
      const e = parseResponse(err, res);
      if (e) return reject(e);
      if (headers[`x-ms-continuation`]) res.continuation = headers[`x-ms-continuation`];
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

// arguments: data, userId, options
const updateDoc = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/update`, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

// arguments: data, userId, options
const upsertDoc = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/upsert`, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});


// EXPORTED CRUD METHODS
const create = async (data = {}, userId, type) => {
  const Model = dlx.models[type];
  const model = addPermissions(hydrate(data, Model));
  model.permissions.owners.push(userId);
  const doc = await createDoc(model);
  return scrub(hydrate(doc, Model), userId);
};

const get = async (id, userId, options = {}) => {
  const doc = await readDoc(id, userId, options);
  return scrub(hydrate(doc), userId);
};

const getAll = async (userId, type, options) => {

  const { ifModifiedSince, public: pub } = options;

  const publicQuery = `
    c.permissions.public = true
    OR
  `;

  const permissionsQuery = `
    -- User has view permissions
    AND (
      ${pub ? publicQuery : ''}
      ARRAY_CONTAINS(c.permissions.viewers, @userId)      -- User is viewer
      OR
      ARRAY_CONTAINS(c.permissions.contributors, @userId) -- User is contributor
      OR
      ARRAY_CONTAINS(c.permissions.owners, @userId)       -- User is owner
    )
  `;

  const lastModifiedQuery = `
    -- Has been modified after the value of If-Modified-Since
    AND c._ts >= @ifModifiedSince
  `;

  const querySpec = {

    parameters: [
      {
        name:  `@ifModifiedSince`,
        value: new Date(ifModifiedSince || null) / 1000 | 0,
      },
      {
        name:  `@userId`,
        value: userId,
      },
      {
        name: `@type`,
        value: type,
      },
    ],

    query: `
      SELECT * FROM items c
      WHERE
        -- Has correct type
        c.type = @type

        -- TTL is not set
        AND (NOT IS_DEFINED(c.ttl))

        ${userId ? permissionsQuery : 'AND c.public = true'}
        ${ifModifiedSince ? lastModifiedQuery : ''}
    `,

  };

  const docs            = await queryDocs(querySpec, options);
  const response        = docs.map(doc => scrub(hydrate(doc), userId));
  if (docs.continuation) response.continuation = docs.continuation;
  return response;

};

const update = async (data = {}, userId, options = {}) => {
  hydrate(data); // do not update with model - this will overwrite properties on the database version
  const doc = await updateDoc(data, userId, options);
  return scrub(hydrate(doc), userId);
};

const upsert = async (data = {}, userId, options = {}) => {
  if (!data.id) return create(data, userId, data.type);
  const model = hydrate(data);
  const doc   = await upsertDoc(model, userId, options);
  return scrub(hydrate(doc), userId);
};

module.exports = {
  client:  db,
  coll,
  create,
  delete:  deleteDoc,
  destroy: deleteDoc,
  get,
  getAll,
  update,
  upsert,
};
