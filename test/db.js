/* eslint-disable
  func-style,
  require-jsdoc,
*/

const { promisify } = require('util');
const { client: db, coll } = require(`../lib/db`);

const destroy = promisify(db.deleteDocument).bind(db);
const upsert  = promisify(db.upsertDocument).bind(db);

const deleteAllDocs = () => new Promise((resolve, reject) => {
  db.readDocuments(coll).toArray((err, res) => {
    if (err) reject(err);
    else resolve(Promise.all(res.map(doc => destroy(doc._self))));
  });
});

const deleteTestDocs = () => new Promise((resolve, reject) => {

  const query = `
  SELECT * FROM items c
  WHERE c.test = true
  `;

  db.queryDocuments(coll, query).toArray((err, res) => {
    if (err) reject(err);
    else resolve(Promise.all(res.map(doc => destroy(doc._self))));
  });

});

module.exports = {
  coll,
  deleteAllDocs,
  deleteTestDocs,
  destroy,
  upsert,
};
