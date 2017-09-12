/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function update(data, userID, { ifMatch } = {}) {

  const { response } = __;
  const link         = __.getAltLink();

  const parseError = err => {

    if (!err) return;

    switch (err.number) {
      case 400:
      case 403:
        throw new Error(500, `Unknown database error.`);
      case 404:
        throw new Error(404, `Resource with ID ${data.id} does not exist.`);
      case 412:
        throw new Error(412, `Precondition not met for resource with ID ${data.id}.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

    parseError(err);

    // NOTE: Do not return a 410 error here - updating a deleted document should undelete it

    // ensure that permissions are correctly formatted, and set to their defaults if not
    doc.permissions              = doc.permissions || {};
    doc.permissions.owners       = doc.permissions.owners || [];
    doc.permissions.contributors = doc.permissions.contributors || [];
    doc.permissions.viewers      = doc.permissions.viewers || [];
    if (!(`public` in doc.permissions)) doc.permissions.public = false;

    if (doc.permissions.owners.includes(userID) || doc.permissions.contributors.includes(userID)) {

      Reflect.deleteProperty(data, `permissions`);
      Object.assign(doc, data);
      delete doc.ttl; // users cannot set their own TTL; also undeletes the item

      const opts = {};
      if (ifMatch) opts.etag = ifMatch;

      const accepted = __.replaceDocument(doc._self, doc, opts, (err, res) => {
        parseError(err);
        if (!res._ts) res._ts = new Date() / 1000 | 0;
        response.setBody(res);
      });

      if (!accepted) throw new Error(408, `Timeout updating resource.`);

    } else {

      throw new Error(403, `User does not have permissions to update the resource with ID ${doc.id}.`);

    }

  });

  if (!accepted) throw new Error(408, `Timeout reading resource for upsert.`);

}
