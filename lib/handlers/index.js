const statuses        = require('statuses');
const wwwAuthenticate = require('../utils').wwwAuthenticate;
const v0              = require('./handlers.v0');

const errors = (err, req, res, next) => {

  const status = Number.isInteger(Number(err.status)) ? err.status : 500;
  const message = status < 500 ? err.message : statuses[err.status];

  const body = {
    status,
    message,
  };

  // handle JWT errors
  if (err.name === 'UnauthorizedError') {

    err.headers = {};
    body.code = err.code;
    body.name = err.name;

    wwwAuthenticate(err.headers, body.message);

  // handle all other errors
  } else {

    Object.assign(body, err);

  }

  if (err.headers) res.set(err.headers);
  res.status(body.status);
  res.json(body);

};

const notFound = (req, res, next) => {
  res.status(404);
  res.json({
    status:   404,
    message: 'No such route exists.',
  });
};

const test = (req, res) => {
  res.status(200);
  res.json({
    status:   200,
    message: 'Test successful.',
  });
};

const routes = {
  errors,
  notFound,
  test,
};

Object.assign(v0, routes);

module.exports = { v0, errors, notFound, test };
