module.exports = (req, res, next) => {

  // log URL for debugging
  console.log(`\nRequested: ${req.method} ${req.originalUrl}`);

  next();

};
