/* eslint-disable
  block-scoped-var
*/

const config     = require(`./config`);
const dlx        = require(`@digitallinguistics/dlx-js`);
const documentdb = require(`documentdb`);

const { Language } = dlx.models;

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

// Collection URL
const coll = `dbs/dlx/colls/dlx`;

// GENERIC CRUD METHODS
const create = data => new Promise((resolve, reject) => {
  db.createDocument(coll, data, (err, doc) => {
    if (err) reject(err);
    else resolve(doc);
  });
});

const destroy = id => new Promise((resolve, reject) => {
  // TODO: just add a ttl to the document
  // make a sproc if necessary
});

const get = id => new Promise((resolve, reject) => {
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

const getAll = (type, userId, { continuation, ids }) => new Promise((resolve, reject) => {

  if (ids && ids.length === 1) return get(ids[0]).then(doc => [doc]).then(resolve);

  const idsQuery = `
    -- ID is contained in IDs array
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
    ],

    query: `
      SELECT * FROM dlx d
      WHERE
        -- TTL is not set, and 'test' is false
        (NOT IS_DEFINED(d.ttl) OR ((IS_DEFINED(d.test)) AND (d.test = true)))

        ${userId ? permissionsQuery : ''}
        ${ids.length ? idsQuery : ''}
    `,

  };

  querySpec.query = `
    SELECT * FROM dlx d
    WHERE ARRAY_CONTAINS(@ids, d.id)
  `;

  db.queryDocuments(coll, querySpec, { continuation }).toArray((err, res) => {
    if (err) reject(err);
    else resolve(res);
  });

});

const upsert = (data = {}, userId) => new Promise((resolve, reject) => {
  const sprocLink = `${coll}/sprocs/upsert`;
  db.executeStoredProcedure(sprocLink, [data, userId], (err, res) => {
    if (err) reject(err);
    else resolve(res);
  });
});

// TYPE-SPECIFIC METHODS
const getLanguage = async langId => {

  try {
    var doc = await get(langId);
  } catch (e) {
    const message = e.code == 404 ?
      `No resource with the ID "${langId}" was found.` :
      `There was a problem retrieving the data from the database.`;
    const err = new Error(message);
    err.status = e.status || e.code || 500;
    throw err;
  }

  try {
    var lang = new Language(doc);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status(400);
    throw err;
  }

  return lang;

};

const getLanguages = async (userId, options) => {

  options.ids = options.ids ? options.ids.split(`,`).map(id => id.trim()).filter(id => id) : [];

  const docs = await getAll(`language`, userId, options);
  return docs.map(doc => new Language(doc));

};

const upsertLanguage = async (data, userId) => {

  try {
    var lang = new Language(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: "${e.message}"`);
    err.status(400);
    throw err;
  }

  try {
    var doc = await upsert(lang, userId);
  } catch (e) {
    const err = new Error(`There was a problem upserting the language data.`);
    err.status = e.status || e.code || 500;
    throw err;
  }

  return new Language(doc);

};

/* eslint-disable sort-keys */
module.exports = {

  client: db,

  coll,
  create,
  get,
  upsert,

  getLanguage,
  getLanguages,
  upsertLanguage,

};
