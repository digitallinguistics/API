const config = require(`../../config`);

module.exports = (req, res, next) => {
  if (config.env.development) console.log(`\nRequested: ${req.method} ${req.originalUrl}`);
  next();
};
