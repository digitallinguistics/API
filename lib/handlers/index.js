const statuses        = require('http').STATUS_CODES;
const wwwAuthenticate = require('../utils').wwwAuthenticate;
const v0              = require('./handlers.v0');

const { authRequest, tokenRequest } = require('../auth');

// ROUTE HANDLERS
const auth = authRequest;

const errors = (err, req, res, next) => {

  const status = Number.isInteger(Number(err.status)) ? err.status : 500;
  const message = status < 500 ? err.message : statuses[err.status];

  const body = {
    message,
    status,
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
    message: 'No such route exists.',
    status:   404,
  });
};

const test = (req, res) => {
  res.status(200);
  res.json({
    message: 'Test successful.',
    status:   200,
  });
};

const token = tokenRequest;

// EXPORTS
const routes = {
  auth,
  errors,
  notFound,
  test,
  token,
};

Object.assign(v0, routes);

module.exports = {
  auth,
  errors,
  notFound,
  test,
  token,
  v0,
};
