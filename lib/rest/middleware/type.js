const types = {
  languages: `Language`,
};

module.exports = (req, res, next) => {

  const collection = req.path.split(`/`)
  .filter(part => part)
  .filter(part => !/v[0-9]/.test(part))[0];

  if (collection) req.collection = collection;

  if (types[collection]) {
    req.Type       = types[collection];
    req.type       = types[collection].toLowerCase();
  }

  next();

};
