const config = require('../../config');

module.exports = (req, res, next) => {
  if (config.localhost) console.log(`\nRequested: ${req.method} ${req.originalUrl}`);
  next();
};
