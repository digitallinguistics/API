/* global __ */

/* eslint-disable
  func-style,
  require-jsdoc,
*/

function get(id, userId, options) {

  const { response } = __;
  const link = __.getAltLink();

  const parseError = err => {

    if (!err) return;

    switch (err.number) {
      case 304:
        throw new Error(304, `Data has not been updated.`);
      case 400:
        throw new Error(500, `Unknown database error.`);
      case 404:
        throw new Error(404, `Document with ID "${id}" does not exist.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const accepted = __.readDocument(`${link}/docs/${id}`, options, (err, doc, info) => {

    if (info && info.notModified) throw new Error(304, `Document with ID "${id}" has not been modified.`);

    parseError(err);

    if (doc.ttl) throw new Error(404, `Document with ID "${id}" no longer exists.`);

    const p = doc.permissions;

    if (!(
      p.public === true
      || p.viewers.includes(userId)
      || p.contributors.includes(userId)
      || p.owners.includes(userId)
    )) {
      throw new Error(403, `The client or user has insufficient permissions to access the resource with ID "${id}".`);
    }

    response.setBody(doc);

  });

  if (!accepted) throw new Error(408, `Timeout reading document for upsert.`);

}
