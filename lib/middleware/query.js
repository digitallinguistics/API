module.exports = (req, res, next) => {
  if (`ids` in req.query) req.query.ids = req.query.ids ? req.query.ids.split(/[, ]+/) : [];
  next();
};
