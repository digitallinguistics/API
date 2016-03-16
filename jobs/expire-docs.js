// set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
if (process.env.NODE_ENV === 'localhost') { require('../../credentials/dlx-api'); }

const DocumentDB = require('documentdb');
const documentdb = new DocumentDB.DocumentClient(process.env.DOCUMENTDB_HOST, { masterKey: process.env.DOCUMENTDB_MASTER_KEY });

documentdb.readCollections(`dbs/${process.env.DOCUMENTDB_RID}/`).toArray((err, colls) => {
  if (err) {
    console.error(err);
  } else {

    const authReqs = colls.filter(coll => coll.id === 'authRequests')[0];
    const sessions = colls.filter(coll => coll.id === 'sessions')[0];

    documentdb.readStoredProcedures(authReqs._self).toArray((err, sprocs) => {
      const expire = sprocs.filter(sproc => sproc.id === 'expire')[0];
      documentdb.executeStoredProcedure(expire._self, err => {
        if (err) { console.error(err); }
      });
    });

    documentdb.readStoredProcedures(sessions._self).toArray((err, sprocs) => {
      const expire = sprocs.filter(sproc => sproc.id === 'expire')[0];
      documentdb.executeStoredProcedure(expire._self, err => {
        if (err) { console.error(err); }
      });
    });
  }
});
