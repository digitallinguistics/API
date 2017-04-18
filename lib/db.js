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

const getAll = ids => new Promise((resolve, reject) => {
  // TODO: use queryDocs rather than get - this will be more efficient
  // special case for when there is only 1 ID
  // query should exclude docs with TTL, unless `test: true` is set
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
  upsertLanguage,

};
