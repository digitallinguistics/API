const documentdb = require('documentdb');

// initialize Azure DocumentDB
const dbKey = process.env.DOCUMENTDB_KEY;
const dbUrl = process.env.DOCUMENTDB_URL;
const db = new documentdb.DocumentClient(dbUrl, { masterKey: dbKey });

db.coll = 'dbs/dlx/colls/dlx';

module.exports = db;
