/** Returns a 404 response if no other routes are matched */
exports.error404 = (req, res) => {
  respond(null, 404, res);
};

/** Returns a 500 response if uncaught internal errors occur */
exports.error500 = (err, req, res) => {
  console.error(err);
  respond(err, null, res);
};

/** URL logging for debugging */
exports.log = (req, res, next) => {
  console.log('\nRequested URL:', req.url);
  next();
};
