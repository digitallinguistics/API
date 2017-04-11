const statuses = require('http').STATUS_CODES;

module.exports = (status = 500, error, message, props) => {

  const err = new Error(message);

  Object.assign(err, props);

  err.status            = status;
  err.error             = error || statuses[status];
  err.error_description = message || statuses[status];

  return err;

};
