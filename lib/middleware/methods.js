// Middleware that only allows operations on the specified methods (defaults to GET)
module.exports = (methods = ['GET']) => (req, res, next) => {
  if (methods.includes(req.method)) return next();
  return res.error(405, null, `The ${req.method} method for the "${req.originalUrl}" route is not supported.`);
};