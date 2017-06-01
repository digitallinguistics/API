/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function destroy(id, userId, { ifMatch } = {}) {

  if (!id) throw new Error(400, `An ID must be provided for delete operations.`);
  if (!userId) throw new Error(403, `A user must be specified in order to delete a resource.`);

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

  const accepted = __.readDocument(`${link}/docs/${id}`, (err, doc) => {

    parseError(err);

    doc.permissions       = doc.permissions || permissions;
    doc.permissions.owner = doc.permissions.owner || [];

    if (doc.permissions.owner.includes(userId)) {

      const opts = {};
      if (ifMatch) opts.etag = ifMatch;
      doc.ttl = 2592000; // 30 days

      const accepted = __.replaceDocument(doc._self, doc, opts, err => {

        parseError(err);

        response.setBody({
          status:  204,
          details: `Document with ID "${id}" was successfully set to expire.`,
        });

      });

      if (!accepted) throw new Error(408, `Timeout deleting the document with ID "${id}".`);

    } else {

      throw new Error(403, `The user does not have permissions to delete the resource with ID '${id}'.`);

    }

  });

  if (!accepted) throw new Error(408, `Timeout reading document for deletion.`);

}
