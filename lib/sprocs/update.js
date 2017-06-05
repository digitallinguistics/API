/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function update(data, userId, { ifMatch } = {}) {

  const { response } = __;
  const link         = __.getAltLink();

  const parseError = err => {

    if (!err) return;

    switch (err.number) {
      case 400:
      case 403:
        throw new Error(500, `Unknown database error.`);
      case 404:
        throw new Error(404, `Document with ID "${data.id}" does not exist.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

    parseError(err);

    if (doc.permissions.owner.includes(userId) || doc.permissions.contributor.includes(userId)) {

      Object.assign(doc, data);

      const opts = {};
      if (ifMatch) opts.etag = ifMatch;

      const accepted = __.replaceDocument(doc._self, doc, opts, (err, res) => {
        parseError(err);
        response.setBody(res);
      });

      if (!accepted) throw new Error(408, `Timeout updating document.`);

    } else {

      throw new Error(403, `User does not have permissions to update the resource with ID '${doc.id}'.`);

    }

  });

  if (!accepted) throw new Error(408, `Timeout reading document for upsert.`);

}
