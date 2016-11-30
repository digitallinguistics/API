module.exports = (req, res, next) => {

  // log URL for debugging
  console.log(`\nRequested URL: ${req.originalUrl}`);

  next();

};
