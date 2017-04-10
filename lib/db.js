const config     = require('./config');
const documentdb = require('documentdb');

// initialize Azure DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

// the URL of the collection
const coll = 'dbs/dlx/colls/dlx';

// create a new document
const create = data => new Promise((resolve, reject) => {
  db.createDocument(coll, data, (err, doc) => {
    if (err) reject(err);
    else resolve(doc);
  });
});

// retrieve a client
const get = id => new Promise((resolve, reject) => {
  db.readDocument(`${coll}/docs/${id}`, (err, client) => {
    if (err) reject(err);
    else resolve(client);
  });
});

const upsert = data => new Promise((resolve, reject) => {
  db.upsertDocument(coll, data, (err, doc) => {
    if (err) reject(err);
    else resolve(doc);
  });
});

module.exports = {
  coll,
  create,
  get,
  upsert,
};
