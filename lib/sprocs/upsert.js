/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function upsert(data = {}, userId, { ifMatch } = {}) {

  const { response } = __;
  const link = __.getAltLink();

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

  if (data.id) {

    const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

      parseError(err);

      if (data.permissions.owner.includes(userId) || data.permissions.contributor.includes(userId)) {

        const opts = {};
        if (ifMatch) opts.etag = ifMatch;

        const accepted = __.replaceDocument(doc._self, data, opts, (err, res) => {
          parseError(err);
          response.setBody(res);
        });

        if (!accepted) throw new Error(408, `Timeout upserting document.`);

      } else {

        throw new Error(403, `User does not have permissions to upsert the resource with ID "${doc.id}".`);

      }

    });

    if (!accepted) throw new Error(408, `Timeout reading document for upsert.`);

  } else {

    data.permissions.owner.push(userId);

    const accepted = __.createDocument(link, data, (err, res) => {
      parseError(err);
      response.setBody(res);
    });

    if (!accepted) throw new Error(408, `Timeout upserting document.`);

  }

}
