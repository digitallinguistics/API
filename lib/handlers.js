const error404 = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(404);
  res.json({
    status:  404,
    details: 'Route not found.',
  });
};

const error500 = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(500);
  res.json({
    status:  500,
    details: err.message,
  });
};

const home = (req, res, next) => {};

module.exports = {
  error404,
  error500,
  home,
};
