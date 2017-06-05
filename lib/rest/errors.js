const convertError = require('../utils/convertError');

const methodNotAllowed = (req, res) => res.error(405, `The ${req.method} method for the "${req.originalUrl}" route is not supported.`);

const notFound = (req, res) => res.error(404, `The ${req.originalUrl} route does not exist.`);

const serverError = (err, req, res, next) => {

  // if (require(`../config`).env !== `production`) console.log(err);

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
