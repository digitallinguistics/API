/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function upsert(data = {}, userID, { ifMatch } = {}) {

  const { response } = __;
  const link = __.getAltLink();

  const defaultPermissions = {
    contributors: [],
    owners:       [userID],
    public:       false,
    viewers:      [],
  };

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

  delete data.ttl; // users cannot set their own TTL; also undeletes a document if it is upserted again

  if (data.id) {

    const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

      parseError(err);

      // ensure that permissions are correctly formatted, and set to their defaults if not
      doc.permissions = doc.permissions instanceof Object ? doc.permissions : {};
      const p         = doc.permissions;
      p.contributors  = Array.isArray(p.contributors) ? p.contributors : [];
      p.owners        = Array.isArray(p.owners) ? p.owners : [];
      p.viewers       = Array.isArray(p.viewers) ? p.viewers : [];
      p.public        = `public` in p ? p.public : false;

      if (doc.permissions.owners.includes(userID) || doc.permissions.contributors.includes(userID)) {

        const opts             = {};
        if (ifMatch) opts.etag = ifMatch;
        data.permissions       = doc.permissions;

        const accepted = __.replaceDocument(doc._self, data, opts, (err, res) => {
          parseError(err);
          if (!res._ts) res._ts = new Date() / 1000 | 0;
          response.setBody(res);
        });

        if (!accepted) throw new Error(408, `Timeout upserting resource.`);

      } else {

        throw new Error(403, `User does not have permissions to upsert the resource with ID ${doc.id}.`);

      }

    });

    if (!accepted) throw new Error(408, `Timeout reading resource for upsert.`);

  } else {

    data.permissions = defaultPermissions;

    const accepted = __.createDocument(link, data, (err, res) => {
      parseError(err);
      response.setBody(res);
    });

    if (!accepted) throw new Error(408, `Timeout upserting resource.`);

  }

}
