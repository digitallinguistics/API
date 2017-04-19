/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  require-jsdoc,
*/

function destroy(id, userId) {

  const { response } = __;
  const link = `dbs/dlx/colls/items`;

  const permissions = {
    contributor: [],
    owner:       [],
    public:      false,
    viewer:      [],
  };

  const accepted = __.readDocument(`${link}/docs/${id}`, (err, doc) => {

    if (err) throw err;

    doc.permissions       = doc.permissions || permissions;
    doc.permissions.owner = doc.permissions.owner || [];

    if (doc.permissions.owner.includes(userId)) {

      doc.ttl = 2592000; // 30 days

      const accepted = __.upsertDocument(link, doc, err => {

        if (err) throw new Error(`There was an error deleting the document with ID "${id}".`);

        response.setBody({
          status:  204,
          details: `Document with ID "${id}" was successfully set to expire.`,
        });

      });

      if (!accepted) throw new Error(`Timeout deleting the document with ID "${id}".`);

    } else {

      const err = new Error(`The user does not have permissions to delete the resource with ID "${id}".`);
      err.status = 403;
      throw err;

    }

  });

  if (!accepted) throw new Error(`Timeout reading document for deletion.`);

}
