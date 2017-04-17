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

const get = id => new Promise((resolve, reject) => {
  db.readDocument(`${coll}/docs/${id}`, (err, client) => {
    if (err) reject(err);
    else resolve(client);
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
const upsertLanguage = async (data, userId) => {

  try {
    var lang = new Language(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: "${e.message}"`);
    err.status(400);
    throw err;
  }

  if (lang) {
    try {
      var doc = await upsert(lang, userId);
    } catch (e) {
      const err = new Error(`There was a problem upserting the language data: ${e.message}`);
      err.status = e.status || 500;
      throw err;
    }
  }

  if (doc) {

    Reflect.deleteProperty(doc, `_RID`);
    Reflect.deleteProperty(doc, `_SELF`);
    Reflect.deleteProperty(doc, `_ATTACHMENTS`);
    Reflect.deleteProperty(doc, `permissions`);

    return new Language(doc);

  }

  throw new Error(`The "upsertLanguage" operation failed.`);

};

/* eslint-disable sort-keys */
module.exports = {

  coll,
  create,
  get,
  upsert,

  upsertLanguage,

};
