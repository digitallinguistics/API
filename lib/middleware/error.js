const statuses = require('http').STATUS_CODES;

const createError = (status = 500, error, message, props) => {

  const err = new Error(message);

  Object.assign(err, props);

  err.status            = status;
  err.error             = error || statuses[status];
  err.error_description = message || statuses[status];

  return err;

};

module.exports = (req, res, next) => {

  res.error = (...args) => {
    const err = createError(...args);
    next(err);
  };

  next();

};
