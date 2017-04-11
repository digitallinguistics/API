/* eslint-disable no-console, no-param-reassign */

const createError = require('./error');

module.exports = (req, res, next) => {

  // log URL for debugging
  console.log(`\nRequested URL: ${req.originalUrl}`);

  // add res.error() method
  res.error = (...args) => {
    const err = createError(...args);
    next(err);
  };

  next();

};
