/* eslint-disable no-console */

const createError = require('http-errors');

module.exports = (req, res, next) => {

  // log URL for debugging
  console.log(`\nRequested URL: ${req.originalUrl}`);

  res.error = (status, message, props) => {
    const err = createError(status, message, props);
    next(err);
  };

  next();

};
