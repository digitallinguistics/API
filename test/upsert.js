const { client: db, coll } = require(`../lib/db`);

module.exports = data => new Promise((resolve, reject) => {
  const hasId = data.id;
  db.upsertDocument(coll, data, (err, res) => {
    if (!hasId) Reflect.deleteProperty(data, `id`);
    if (err) reject(err);
    resolve(res);
  });
});
