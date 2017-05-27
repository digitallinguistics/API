/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function destroy(id, userId, { ifMatch } = {}) {

  if (!id) {
    throw JSON.stringify({
      code:    400,
      message: `An ID must be provided for delete operations.`,
    });
  }

  if (!userId) {
    throw JSON.stringify({
      code:    403,
      message: `A user must be specified in order to delete a resource.`,
    });
  }

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

    const e = {};

    switch (err.number) {
      case 400:
      case 403:
        e.code = 500;
        break;
      default:
        e.code = err.number;
    }

    return JSON.stringify(e);

  };

  const accepted = __.readDocument(`${link}/docs/${id}`, (err, doc) => {

    const e = parseError(err);
    if (e) throw e;

    doc.permissions       = doc.permissions || permissions;
    doc.permissions.owner = doc.permissions.owner || [];

    if (doc.permissions.owner.includes(userId)) {

      const opts = {};
      if (ifMatch) opts.etag = ifMatch;
      doc.ttl = 2592000; // 30 days

      const accepted = __.replaceDocument(doc._self, doc, opts, err => {

        const e = parseError(err);
        if (e) throw e;

        response.setBody({
          status:  204,
          details: `Document with ID "${id}" was successfully set to expire.`,
        });

      });

      if (!accepted) {
        throw JSON.stringify({
          code:    408,
          message: `Timeout deleting the document with ID "${id}".`,
        });
      }

    } else {

      throw JSON.stringify({
        code:    403,
        message: `The user does not have permissions to delete the resource with ID '${id}'.`,
      });

    }

  });

  if (!accepted) {
    throw JSON.stringify({
      code:    408,
      message: `Timeout reading document for deletion.`,
    });
  }

}
