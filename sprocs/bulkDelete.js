/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-shadow,
  no-underscore-dangle,
  require-jsdoc,
*/

function bulkDelete(ids = [], userID) {

  const { response } = __;
  const link         = __.getAltLink();

  const body = {
    continuation: true,
    remaining: ids,
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
          if (err) reject(err);
          else resolve();
        });

        if (!accepted) {
          body.staus = 408;
          response.setBody(body);
          reject();
        }

      } else {

        throw new Error(403, `The user does not have permissions to delete ${doc.type} with ID ${id}.`);

      }

    });

    if (!accepted) {
      body.status = 408;
      response.setBody(body);
      reject();
    }

  });

  Promise.all(ids.map(deleteDoc))
  .then(() => {
    body.continuation = false;
    response.setBody(body);
  })
  .catch(err => {
    if (err) throw new Error(err.number, `Database error.`);
    response.setBody(body);
  });

}
