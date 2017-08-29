/**
 * Sets req.Type, req.type, req.collection, and req.subCollection
 */

/* eslint-disable
  no-param-reassign
*/

const types = {
  languages: `Language`,
  lexemes:   `Lexeme`,
};

module.exports = (req, res, next) => {

  const [collection, , subCollection] = req.path.split(`/`)
  .filter(part => part)
  .filter(part => !/v[0-9]/.test(part));

  if (collection) {
    req.collection = collection;
    req.Type       = subCollection ? types[subCollection] : types[collection];
    if (req.Type) req.type = req.Type.toLowerCase();
    if (subCollection) req.subCollection = subCollection;
  }

  next();

};
