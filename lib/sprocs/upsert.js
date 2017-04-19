/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  require-jsdoc,
*/

function upsert(data = {}, userId) {

  if (!userId) throw new Error(`Resources cannot be created anonymously.`);

  const { response } = __;
  const link = `dbs/dlx/colls/items`;

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

  if (data.id) {

    const { id } = data;

    const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

      if (err) throw new Error(`Could not update the resource with ID "${id}".`);

      doc.permissions             = doc.permissions || permissions;
      doc.permissions.owner       = doc.permissions.owner || [];
      doc.permissions.contributor = doc.permissions.contributor || [];

      if (doc.permissions.owner.includes(userId) || doc.permissions.contributor.includes(userId)) {
        upsertDoc(data);
      } else {
        throw new Error(`User does not have permissions to update the resource with ID "${doc.id}".`);
      }

    });

    if (!accepted) throw new Error(`Timeout reading document for upsert.`);

  } else {

    data.permissions = permissions;
    data.permissions.owner.push(userId);
    upsertDoc(data);

  }

}
