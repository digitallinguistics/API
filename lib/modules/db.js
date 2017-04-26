const config      = require(`../config`);
const dlx         = require(`@digitallinguistics/dlx-js`);
const documentdb  = require(`documentdb`);
const permissions = require(`../utils/permissions`);

const { isContributor, isPublic, isViewer } = permissions;

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

// Collection URL
const coll = `dbs/dlx/colls/items`;


// UTILITIES
const hydrate = (data, Model) => {

  try {
    var model = new Model(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status = 422;
    throw err;
  }

  return model;

};

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


// DOCUMENTDB CRUD METHODS
const createDoc = data => new Promise((resolve, reject) => {
  db.createDocument(coll, data, (err, doc) => {
    const e = parseResponse(err, doc);
    if (e) return reject(e);
    resolve(doc);
  });
});

const deleteDoc = (...args) => new Promise((resolve, reject) => {
  // arguments: id, userId, options
  const sprocLink = `${coll}/sprocs/destroy`;
  db.executeStoredProcedure(sprocLink, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

const readDoc = (id, options) => new Promise((resolve, reject) => {

  const opts = {};

  if (options.ifNoneMatch) {
    opts.accessCondition = {
      condition: options.ifNoneMatch,
      type:      `IfNoneMatch`,
    };
  }

  db.readDocument(`${coll}/docs/${id}`, opts, (err, doc) => {

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

const queryDocs = (querySpec, options) => new Promise((resolve, reject) => {

  const { maxItemCount } = options;
  const queryIterator    = db.queryDocuments(coll, querySpec, options);

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

const updateDoc = (...args) => new Promise((resolve, reject) => {
  // arguments: data, userId, options
  const sprocLink = `${coll}/sprocs/update`;
  db.executeStoredProcedure(sprocLink, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});

const upsertDoc = (...args) => new Promise((resolve, reject) => {
  // arguments: data, userId, options
  const sprocLink = `${coll}/sprocs/upsert`;
  db.executeStoredProcedure(sprocLink, [...args], (err, res) => {
    const e = parseResponse(err, res);
    if (e) reject(e);
    else resolve(res);
  });
});


// EXPORTED CRUD METHODS
const create = async (data, userId, Type) => {

  const Model = dlx.models[Type];
  const model = hydrate(data, Model);

  model.permissions = {
    contributor: [],
    owner:       [userId],
    public:      false,
    viewer:      [],
  };

  const doc = await createDoc(model);
  return scrub(new Model(doc), userId);

};

const destroy = deleteDoc;

const get = async (id, userId, Type, options = {}) => {

  const doc   = await readDoc(id, options);
  const Model = dlx.models[Type];
  const model = hydrate(doc, Model);

  if (!(isPublic(model) || isViewer(model, userId))) {
    const err = new Error(`The client or user has insufficient permissions to access the resource with ID "${id}".`);
    err.status = 403;
    throw err;
  }

  return scrub(model, userId);

};

const getAll = async (userId, Type, options) => {

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
    `,

  };

  const docs     = await queryDocs(querySpec, options);
  const Model    = dlx.models[Type];
  const models   = docs.map(doc => hydrate(doc, Model));
  const response = models.map(model => scrub(model, userId));

  response.continuation = docs.continuation;

  return response;

};

const update = async (data = {}, userId, Type, options = {}) => {
  const Model = dlx.models[Type];
  const model = hydrate(data, Model);
  const doc   = await updateDoc(model, userId, options);
  return scrub(new Model(doc), userId);
};

const upsert = async (data = {}, userId, Type, options = {}) => {
  const Model = dlx.models[Type];
  const model = hydrate(data, Model);
  const doc   = await upsertDoc(model, userId, options);
  return scrub(new Model(doc), userId);
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
};
