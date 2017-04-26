/* global __ */

/* eslint-disable
  func-style,
  no-param-reassign,
  no-throw-literal,
  require-jsdoc,
*/

function upsert(data = {}, userId, { ifMatch } = {}) {

  if (!userId) {
    throw {
      code:    403,
      message: `Resources cannot be created anonymously.`,
    };
  }

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

  if (data.id) {

    const accepted = __.readDocument(`${link}/docs/${data.id}`, (err, doc) => {

      const e = parseError(err);
      if (e) throw e;

      doc.permissions             = doc.permissions || permissions;
      doc.permissions.owner       = doc.permissions.owner || [];
      doc.permissions.contributor = doc.permissions.contributor || [];

      if (doc.permissions.owner.includes(userId) || doc.permissions.contributor.includes(userId)) {

        const opts = {};
        if (ifMatch) opts.etag = ifMatch;

        const accepted = __.replaceDocument(doc._self, data, opts, (err, res) => {

          const e = parseError(err);
          if (e) throw e;

          if (!res.url) {
            const collection = collections[res.Type];
            res.url = `https://api.digitallinguistics.io/${collection}/${data.id}`;
          }

          response.setBody(res);

        });

        if (!accepted) {
          throw {
            code:    408,
            message: `Timeout upserting document.`,
          };
        }

      } else {

        throw {
          code:    403,
          message: `User does not have permissions to upsert the resource with ID "${doc.id}".`,
        };

      }

    });

    if (!accepted) {
      throw {
        code:    408,
        message: `Timeout reading document for upsert.`,
      };
    }

  } else {

    data.permissions       = data.permissions || permissions;
    data.permissions.owner = data.permissions.owner || [];
    data.permissions.owner.push(userId);

    const accepted = __.createDocument(link, data, (err, res) => {
      const e = parseError(err);
      if (e) throw e;
      response.setBody(res);
    });

    if (!accepted) {
      throw {
        code:    408,
        message: `Timeout upserting document.`,
      };
    }

  }

}
