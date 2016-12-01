const config = require('./config');
const documentdb = require('documentdb');

// initialize Azure DocumentDB
const db = new documentdb.DocumentClient(config.dbUrl, { masterKey: config.dbKey });

db.coll = 'dbs/dlx/colls/dlx';

module.exports = db;
