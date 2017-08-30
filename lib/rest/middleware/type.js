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
    req.Type = types[collection];
    // NOTE: the conditional is necessary to prevent throwing an error before the 404 handler is reached
    if (req.Type) req.type = req.Type.toLowerCase();
  }

  if (subCollection) {
    req.SubType = types[subCollection];
    req.subType = req.SubType.toLowerCase();
  }

  next();

};
