/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function upsert(data = {}, userId, { ifMatch } = {}) {

  if (!userId) throw new Error(403, `Resources cannot be created anonymously.`);

  const { response } = __;
  const link = __.getAltLink();

  const collections = {
    Language: `languages`,
  };

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

  if (data.id) {

    const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

      parseError(err);

      doc.permissions             = doc.permissions || permissions;
      doc.permissions.owner       = doc.permissions.owner || [];
      doc.permissions.contributor = doc.permissions.contributor || [];

      if (doc.permissions.owner.includes(userId) || doc.permissions.contributor.includes(userId)) {

        const opts = {};
        if (ifMatch) opts.etag = ifMatch;

        const accepted = __.replaceDocument(doc._self, data, opts, (err, res) => {

          parseError(err);

          if (!res.url) {
            const collection = collections[res.Type];
            res.url = `https://api.digitallinguistics.io/${collection}/${data.id}`;
          }

          response.setBody(res);

        });

        if (!accepted) throw new Error(408, `Timeout upserting document.`);

      } else {

        throw new Error(403, `User does not have permissions to upsert the resource with ID "${doc.id}".`);

      }

    });

    if (!accepted) throw new Error(408, `Timeout reading document for upsert.`);

  } else {

    data.permissions       = data.permissions || permissions;
    data.permissions.owner = data.permissions.owner || [];
    data.permissions.owner.push(userId);

    const accepted = __.createDocument(link, data, (err, res) => {
      parseError(err);
      response.setBody(res);
    });

    if (!accepted) throw new Error(408, `Timeout upserting document.`);

  }

}
