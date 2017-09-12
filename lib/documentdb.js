const config     = require('./config');
const documentdb = require('documentdb');

// Constants
const coll = `dbs/dlx/colls/items`; // collection URL

// Initialize DocumentDB
const db = new documentdb.DocumentClient(config.dbURL, { masterKey: config.dbKey });

// CRUD Methods

// arguments: ids, userID
const bulkDelete = (ids, userID) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/bulkDelete`, [ids, userID], (err, res, headers) => {

    if (err) return reject(err);

    if (res.continuation) {
      bulkDelete(res.remaining, userID)
      .then(resolve)
      .catch(reject);
    } else {
      resolve({ headers, res });
    }

  });
});

// arguments: data, options
const createDocument = (...args) => new Promise((resolve, reject) => {
  db.createDocument(coll, ...args, (err, res, headers) => {
    if (err) reject(err);
    else resolve({ headers, res });
  });
});

// arguments: id, userID, options
const deleteDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/destroy`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ headers, res });
  });
});

// arguments: id, userID, options
const readDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/get`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ headers, res });
  });
});

// arguments: data, userID, options
const updateDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/update`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ headers, res });
  });
});

// arguments: data, userID, options
const upsertDocument = (...args) => new Promise((resolve, reject) => {
  db.executeStoredProcedure(`${coll}/sprocs/upsert`, [...args], (err, res, headers) => {
    if (err) reject(err);
    else resolve({ headers, res });
  });
});

module.exports = {
  bulkDelete,
  client: db,
  coll,
  createDocument,
  deleteDocument,
  readDocument,
  updateDocument,
  upsertDocument,
};
