/* global __ */

/* eslint-disable
  func-style,
  require-jsdoc,
*/

function get(id, userId, { ifNoneMatch } = {}) {

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

  const opts = {};

  if (ifNoneMatch) {
    opts.accessCondition = {
      condition: ifNoneMatch,
      type:      `IfNoneMatch`,
    };
  }

  const accepted = __.readDocument(`${link}/docs/${id}`, opts, (err, doc) => {

    parseError(err);

    if (doc.ttl && !doc.test) throw new Error(404, `Document with ID "${id}" no longer exists.`);

    const p = doc.permissions;

    if (!(
      p.public === true
      || p.viewer.includes(userId)
      || p.contributor.includes(userId)
      || p.owner.includes(userId)
    )) {
      throw new Error(403, `The client or user has insufficient permissions to access the resource with ID "${id}".`);
    }

    response.setBody(doc);

  });

  if (!accepted) throw new Error(408, `Timeout reading document for upsert.`);

}
