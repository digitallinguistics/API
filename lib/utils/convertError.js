const statuses = require(`http`).STATUS_CODES;

module.exports = err => {

  const status            = Number(err.status || err.code) || 500;
  const error             = err.error || statuses[status];
  const error_description = err.error_description || err.message || statuses[status];

  const e = new Error(status < 500 ? error_description : statuses[status]);

  e.error = error;
  e.error_description = e.message;
  e.status = status;

  return e;

};
