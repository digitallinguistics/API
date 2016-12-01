const config = require('./config');
const db = require('./db');
const statuses = require('statuses');

const notFound = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(404);
  res.json({
    status:  404,
    details: 'Route not found.',
  });
};

const errors = (err, req, res, next) => { // eslint-disable-line no-unused-vars

  const body = {
    status:  err.status || 500,
    message: err.expose ? err.message : statuses[err.status],
  };

  if (err.name === 'UnauthorizedError') { // handle JWT errors
    body.code = err.code;
    body.name = err.name;
  } else {                                // handle all other errors
    Object.assign(body, err);
  }

  res.status = body.status;
  if (err.headers) res.set(err.headers);
  if (config.localhost) body.stack = err.stack;
  res.json(body);

};

module.exports = {
  errors,
  home,
  notFound,
};
