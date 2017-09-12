/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function destroy(id, userID, { ifMatch } = {}) {

  const { response } = __;
  const link         = __.getAltLink();

  const parseError = err => {

    if (!err) return;

    switch (err.number) {
      case 400:
      case 403:
        throw new Error(500, `Unknown database error.`);
      case 404:
        throw new Error(404, `No resource with ID ${id} exists.`);
      case 412:
        throw new Error(412, `Precondition not met for resource with ID ${id}.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const accepted = __.readDocument(`${link}/docs/${id}`, (err, doc) => {

    parseError(err);

    // NOTE: Do not return a 410 response if TTL is already set - just update it

    // ensure that permissions are correctly formatted, and set to their defaults if not
    doc.permissions = doc.permissions instanceof Object ? doc.permissions : {};
    const p         = doc.permissions;
    p.contributors  = Array.isArray(p.contributors) ? p.contributors : [];
    p.owners        = Array.isArray(p.owners) ? p.owners : [];
    p.viewers       = Array.isArray(p.viewers) ? p.viewers : [];
    p.public        = `public` in p ? p.public : false;

    if (doc.permissions.owners.includes(userID)) {

      const opts = {};
      if (ifMatch) opts.etag = ifMatch;
      doc.ttl = 2592000; // 30 days

      const accepted = __.replaceDocument(doc._self, doc, opts, err => {

        parseError(err);

        response.setBody({
          status:  204,
          details: `Resource with ID ${id} was successfully set to expire.`,
          type:    doc.type, // NOTE: a "type" is needed for the Socket to return an informative response
        });

      });

      if (!accepted) throw new Error(408, `Timeout deleting the resouce with ID ${id}.`);

    } else {

      throw new Error(403, `The user does not have permissions to delete the resource with ID ${id}.`);

    }

  });

  if (!accepted) throw new Error(408, `Timeout reading document for deletion.`);

}
