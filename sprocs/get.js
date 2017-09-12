/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  require-jsdoc,
*/

function get(id, userID, options) {

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
        throw new Error(404, `Resource with ID ${id} does not exist.`);
      case 412:
        throw new Error(412, `Precondition not met for resource with ID ${id}.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const accepted = __.readDocument(`${link}/docs/${id}`, options, (err, doc, info) => {

    if (info && info.notModified) throw new Error(304, `Document with ID ${id} has not been modified.`);

    parseError(err);

    if (doc.ttl) throw new Error(410, `Resource with ID ${doc.id} no longer exists.`);

    // ensure that permissions are correctly formatted, and set to their defaults if not
    doc.permissions = doc.permissions instanceof Object ? doc.permissions : {};
    const p         = doc.permissions;
    p.contributors  = Array.isArray(p.contributors) ? p.contributors : [];
    p.owners        = Array.isArray(p.owners) ? p.owners : [];
    p.viewers       = Array.isArray(p.viewers) ? p.viewers : [];
    p.public        = `public` in p ? p.public : false;

    if (!(
      p.public === true
      || p.viewers.includes(userID)
      || p.contributors.includes(userID)
      || p.owners.includes(userID)
    )) {
      throw new Error(403, `The client or user has insufficient permissions to access the resource with ID ${id}.`);
    }

    response.setBody(doc);

  });

  if (!accepted) throw new Error(408, `Timeout reading resource for upsert.`);

}
