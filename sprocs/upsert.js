/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-shadow,
  no-throw-literal,
  no-underscore-dangle,
  require-jsdoc,
*/

function upsert(data = {}, userID, { ifMatch } = {}) {

  const { response } = __;
  const link         = __.getAltLink();

  const defaultPermissions = {
    contributors: [],
    owners:       [userID],
    public:       false,
    viewers:      [],
  };

  const isContributor = item => item.permissions.owners.includes(userID)
    || item.permissions.contributors.includes(userID);

  const parseError = err => {

    if (!err) return;

    switch (err.number) {
      case 400:
      case 403:
        throw new Error(500, `Unknown database error.`);
      case 412:
        throw new Error(412, `Precondition not met for resource with ID ${data.id}.`);
      default:
        throw new Error(err.number, `Database error.`);
    }

  };

  const createDoc = () => {

    data.permissions = defaultPermissions;

    const accepted = __.createDocument(link, data, (err, res) => {
      parseError(err);
      response.setBody(res);
    });

    if (!accepted) throw new Error(408, `Timeout upserting resource.`);

  };

  const upsertDoc = doc => {

    // checks that user has permission to change this data
    if (!isContributor(doc)) {
      throw new Error(403, `User does not have permissions to upsert the resource with ID ${doc.id}.`);
    }

    // set ifMatch option and permissions
    const opts             = {};
    if (ifMatch) opts.etag = ifMatch;
    data.permissions       = doc.permissions;

    const accepted = __.replaceDocument(doc._self, data, opts, (err, res) => {
      parseError(err);
      if (!res._ts) res._ts = Math.floor(new Date() / 1000);
      response.setBody(res);
    });

    if (!accepted) throw new Error(408, `Timeout upserting resource.`);

  };

  // users cannot set their own TTL; also undeletes a document if it is upserted again
  delete data.ttl;

  // create document if there is no ID already provided
  if (!data.id) createDoc();

  // if ID is provided, attempt to retrieve doc, and create doc if it cannot be found
  const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {
    if (err && err.number === 404) createDoc();
    else if (err) parseError(err);
    else upsertDoc(doc);
  });

  if (!accepted) throw new Error(408, `Timeout reading resource for upsert.`);

}
