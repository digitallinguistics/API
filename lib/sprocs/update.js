/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function update(data, userId, { ifMatch } = {}) {

  const throwError = err => { throw `##${JSON.stringify(err)}##`; };

  if (!data.id) {
    throwError({
      code:    422,
      message: `An ID must be provided for partial updates.`,
    });
  }

  if (!userId) {
    throwError({
      code:    403,
      message: `Resources cannot be updated anonymously.`,
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

  const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

    const e = parseError(err);
    if (e) throw e;

    doc.permissions             = doc.permissions || permissions;
    doc.permissions.owner       = doc.permissions.owner || [];
    doc.permissions.contributor = doc.permissions.contributor || [];

    if (doc.permissions.owner.includes(userId) || doc.permissions.contributor.includes(userId)) {

      Object.assign(doc, data);

      const opts = {};
      if (ifMatch) opts.etag = ifMatch;

      const accepted = __.replaceDocument(doc._self, doc, opts, (err, res) => {
        const e = parseError(err);
        if (e) throw e;
        response.setBody(res);
      });

      if (!accepted) {
        throwError({
          code:    408,
          message: `Timeout updating document.`,
        });
      }

    } else {

      throwError({
        code:    403,
        message: `User does not have permissions to update the resource with ID '${doc.id}'.`,
      });

    }

  });

  if (!accepted) {
    throwError({
      code:    408,
      message: `Timeout reading document for upsert.`,
    });
  }

}
