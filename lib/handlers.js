const config   = require('./config');
const statuses = require('statuses');

const notFound = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(404);
  res.json({
    status:  404,
    details: 'No such route exists.',
  });
};

const errors = (err, req, res, next) => { // eslint-disable-line no-unused-vars

  const body = {
    status:  err.status || 500,
    message: err.expose ? err.message : statuses[err.status],
  };

  // handle JWT errors
  if (err.name === 'UnauthorizedError') {

    body.code = err.code;
    body.name = err.name;
    if (body.code === 'credentials_required') {
      body.message = 'All requests to the API must include a Bearer token in the Authorization header.';
    }

  // handle all other errors
  } else {

    Object.assign(body, err);

  }

  res.status(body.status);
  if (err.headers) res.set(err.headers);
  if (config.localhost) body.stack = err.stack;
  res.json(body);

};

module.exports = {
  errors,
  notFound,
};
