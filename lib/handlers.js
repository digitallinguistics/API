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

  Object.assign(body, err);
  res.status = body.status;
  if (err.headers) res.set(err.headers);
  if (process.env.NODE_ENV === 'localhost') body.stack = err.stack;
  res.json(body);

};

const home = (req, res) => {};

module.exports = {
  errors,
  home,
  notFound,
};
