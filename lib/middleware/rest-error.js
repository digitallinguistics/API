const statuses = require('http').STATUS_CODES;

const createError = (status = 500, message = ``, props = {}) => {

  const err = new Error(message);

  Object.assign(err, props);

  err.status            = status;
  err.error             = props.error || statuses[status];
  err.error_description = message || statuses[status];

  return err;

};

module.exports = (req, res, next) => {
  res.error = (...args) => next(createError(...args));
  next();
};
