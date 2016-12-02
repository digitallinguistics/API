const statuses        = require('statuses');
const wwwAuthenticate = require('./utils').wwwAuthenticate;

const errors = (err, req, res, next) => { // eslint-disable-line no-unused-vars

  const status = Number.isInteger(Number(err.status)) ? err.status : 500;
  const message = status < 500 ? err.message : statuses[err.status];

  const body = {
    status,
    message,
  };

  // handle JWT errors
  if (err.name === 'UnauthorizedError') {

    err.headers = {};
    body.code = err.code;
    body.name = err.name;

    wwwAuthenticate(err.headers, body.message);

  // handle all other errors
  } else {

    Object.assign(body, err);

  }

  if (err.headers) res.set(err.headers);
  res.status(body.status);
  res.json(body);

};

const home = (req, res) => {
  res.json({
    message: 'Hi Lindsey!',
  });
};

const methods = (methods = ['GET']) => (req, res, next) => {
  if (methods.includes(req.method)) {
    return next();
  }
  res.error(405, `The ${req.method} method for the "${req.originalUrl}" route is not supported.`);
};

const notFound = (req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(404);
  res.json({
    status:   404,
    message: 'No such route exists.',
  });
};

const test = (req, res) => {
  res.status(200);
  res.json({
    status:   200,
    message: 'Test successful.',
  });
};

module.exports = {
  errors,
  home,
  methods,
  notFound,
  test,
};
