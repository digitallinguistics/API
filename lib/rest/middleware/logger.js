module.exports = (req, res, next) => {
  console.log(`\nRequested: ${req.method} ${req.originalURL}`);
  next();
};
