/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  require-jsdoc,
*/

function upsert(doc = {}, user) {

  const { response } = __;
  const link = `dbs/dlx/colls/dlx`;

  const permissions = {
    contributor: [],
    owner:       [],
    public:      false,
    viewer:      [],
  };

  const upsertDoc = doc => {

    const accepted = __.upsertDocument(link, doc, (err, res) => {
      if (err) throw err;
      response.setBody(res);
    });

    if (!accepted) throw new Error(`Timeout upserting document. E1`);

  };

  if (!user) {

    upsertDoc(doc);

  } else if (user && !doc.id) {

    doc.permissions = permissions;
    doc.permissions.owner.push(user);
    upsertDoc(doc);

  } else {

    const { id } = doc;

    const accepted = __.readDocument(`${link}/docs/${doc.id}`, (err, doc) => {

      if (err) throw new Error(`Could not update the resource with ID "${id}".`);

      doc.permissions             = doc.permissions || permissions;
      doc.permissions.owner       = doc.permissions.owner || [];
      doc.permissions.contributor = doc.permissions.contributor || [];

      if (doc.permissions.owner.includes(user) || doc.permissions.contributor.includes(user)) {
        upsertDoc(doc);
      } else {
        const err  = new Error(`User does not have permissions to update the resource with ID "${doc.id}".`);
        err.status = 403;
        throw err;
      }

    });

    if (!accepted) throw new Error(`Timeout reading document for upsert.`);

  }

}
