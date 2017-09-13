/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-shadow,
  no-underscore-dangle,
  require-jsdoc,
*/

function bulkDelete(IDs = [], userID) {

  const { response } = __;
  const link         = __.getAltLink();
  const ids          = new Set(IDs);

  const body = {
    continuation: true,
    status: 204,
  };

  const deleteDoc = id => new Promise((resolve, reject) => {

    const accepted = __.readDocument(`${link}/docs/${id}`, (err, doc) => {

      if (err && err.number === 404) return resolve();
      else if (err) return reject(err);

      // ensure that permissions are correctly formatted
      doc.permissions        = doc.permissions instanceof Object ? doc.permissions : {};
      doc.permissions.owners = Array.isArray(doc.permissions.owners) ? doc.permissions.owners : [];

      if (doc.permissions.owners.includes(userID)) {

        doc.ttl = 2592000; // 30 days

        const accepted = __.replaceDocument(doc._self, doc, err => {
          if (err) return reject(err);
          ids.delete(id);
          resolve();
        });

        if (!accepted) {
          body.status = 408;
          body.remaining = Array.from(ids);
          response.setBody(body);
          reject();
        }

      } else {

        throw new Error(403, `The user does not have permissions to delete ${doc.type} with ID ${id}.`);

      }

    });

    if (!accepted) {
      body.status = 408;
      body.remaining = Array.from(ids);
      response.setBody(body);
      reject();
    }

  });

  const tasks = Array.from(ids);

  tasks.reduce(async (p, id) => {
    await p;
    return deleteDoc(id);
  }, Promise.resolve())
  .then(() => {
    body.continuation = false;
    body.remaining = [];
    response.setBody(body);
  })
  .catch(err => {
    if (err) throw new Error(err.number, `Database error.`);
    body.remaining = Array.from(ids);
    response.setBody(body);
  });

}
