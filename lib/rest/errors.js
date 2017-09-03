const config           = require('../config');
const { convertError } = require('../utilities');

const methodNotAllowed = (req, res) => res.error(405, `The ${req.method} method for the ${req.originalURL} route is not supported.`);

const notFound = (req, res) => res.error(404, `The ${req.originalURL} route does not exist.`);

const serverError = (err, req, res, next) => {

  if (config.logErrors && err.status >= 500) console.error(err);

  const e = convertError(err);
  if (e.headers) res.set(e.headers);
  res.status(e.status);
  res.json(e);

};

module.exports = {
  methodNotAllowed,
  notFound,
  serverError,
};
