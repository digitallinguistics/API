const statuses = require('http').STATUS_CODES;

const errors = (err, req, res, next) => {

  /* eslint-disable no-param-reassign */

  const status = Number.isInteger(Number(err.status)) ? err.status : 500;
  const message = status < 500 ? err.message : statuses[err.status];

  const body = {
    message,
    status,
  };

  // handle errors thrown by express-jwt
  if (err.name === 'UnauthorizedError') {
    err.error = err.code;
    err.headers = { 'www-authenticate': `Bearer realm="DLx" error="invalid_token" error_description="${message}"` };
    delete err.code;
    delete err.name;
    delete err.inner;
  }

  Object.assign(body, err);
  if (err.headers) res.set(err.headers);
  res.status(body.status);
  res.json(body);

  /* eslint-enable no-param-reassign */

};

const notFound = (req, res, next) => {
  res.status(404);
  res.json({
    message: 'No such route exists.',
    status:   404,
  });
};

module.exports = {
  errors,
  notFound,
};
