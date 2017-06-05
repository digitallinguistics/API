/* eslint-disable
  camelcase,
  no-param-reassign
*/

const statuses = require(`http`).STATUS_CODES;

module.exports = err => {

  const status            = Number(err.status || err.code) || 500;
  const error             = err.error || statuses[status];
  const error_description = err.error_description || err.message || statuses[status];

  // handle errors thrown by express-jwt
  if (err.name === 'UnauthorizedError') {
    err.error = err.code;
    err.headers = { 'www-authenticate': `Bearer realm="DLx" error="invalid_token" error_description="${error_description}"` };
    delete err.code;
    delete err.name;
    delete err.inner;
  }

  const e = new Error(status < 500 ? error_description : statuses[status]);

  e.error             = error;
  e.error_description = status < 500 ? e.message : statuses[status];
  e.status            = status;

  return e;

};
