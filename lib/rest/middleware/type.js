/* eslint-disable
  no-param-reassign
*/

const types = {
  languages: `Language`,
};

module.exports = (req, res, next) => {

  const collection = req.path.split(`/`)
  .filter(part => part)
  .filter(part => !/v[0-9]/.test(part))[0];

  if (collection) {
    req.collection = collection;
    req.Type       = types[req.collection];
    if (req.Type) req.type = req.Type.toLowerCase();
  }

  next();

};
