/* eslint-disable
  func-style,
  require-jsdoc,
*/

const { promisify } = require('util');
const { client: db, coll } = require(`../../lib/db`);

const destroy = promisify(db.deleteDocument).bind(db);
const read    = promisify(db.readDocument).bind(db);
const upsert  = promisify(db.upsertDocument).bind(db);

module.exports = {
  coll,
  destroy,
  read,
  upsert,
};
