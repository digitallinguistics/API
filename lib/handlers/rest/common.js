const config   = require(`../../config`);
const statuses = require('http').STATUS_CODES;

const methodNotAllowed = (req, res) => res.error(405, `The ${req.method} method for the "${req.originalUrl}" route is not supported.`);

const notFound = (req, res) => res.error(404, `The ${req.originalUrl} route does not exist.`);

const serverError = (err, req, res, next) => {

  if (config.env !== `production`) console.log(err);

  /* eslint-disable no-param-reassign */

  const status            = Number(err.status || err.code) || 500;
  const error             = err.error || statuses[status];
  const error_description = err.error_description || err.message || statuses[status];

  // handle errors thrown by express-jwt
  if (err.name === 'UnauthorizedError') {
    err.error = err.code;
    err.headers = { 'www-authenticate': `Bearer realm="DLx" error="invalid_token" error_description="${error_description}"` };
    delete err.code;
    delete err.name;
    delete err.inner;
  }

  const body = {
    error,
    error_description: status < 500 ? error_description : statuses[status],
    status,
  };

  Object.assign(body, err);
  if (err.headers) res.set(err.headers);
  res.status(body.status);
  res.json(body);

  /* eslint-enable no-param-reassign */

};

module.exports = {
  methodNotAllowed,
  notFound,
  serverError,
};
