/* eslint-disable no-console, no-param-reassign */

const createError = require('http-errors');

module.exports = (req, res, next) => {

  // log URL for debugging
  console.log(`\nRequested URL: ${req.originalUrl}`);

  // add res.error() method
  res.error = (status, message, props) => {
    const err = createError(status, message, props);
    next(err);
  };

  next();

};
