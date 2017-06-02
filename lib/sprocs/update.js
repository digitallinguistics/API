/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function update(data, userId, { ifMatch } = {}) {

  if (!data.id) throw new Error(422, `An ID must be provided for partial updates.`);
  if (!userId) throw new Error(403, `Resources cannot be updated anonymously.`);

  const { response } = __;
  const link         = __.getAltLink();

  const permissions = {
    contributor: [],
    owner:       [],
    public:      false,
    viewer:      [],
  };

  const parseError = err => {

    if (!err) return;

    switch (err.number) {
      case 400:
      case 403:
        throw new Error(500, `Unknown database error.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

    parseError(err);

    data.permissions             = doc.permissions || permissions;
    data.permissions.owner       = doc.permissions.owner || [];
    data.permissions.contributor = doc.permissions.contributor || [];

    if (data.permissions.owner.includes(userId) || data.permissions.contributor.includes(userId)) {

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
