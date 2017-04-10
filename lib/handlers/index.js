const db       = require('../db');
const passport = require('../passport');
const statuses = require('http').STATUS_CODES;
const v0       = require('./handlers.v0');

// ROUTE HANDLERS
const auth = async (req, res, next) => {

  // set the default scope
  const scope = req.query.scope || 'user';

  // check for errors with query parameters
  if (!['code', 'token'].includes(req.query.response_type)) {
    res.status(400);
    res.json({
      error:             'unsupported_response_type',
      error_description: 'The "response_type" parameter must be either "code" or "token".',
    });
  }

  if (!['admin', 'public', 'user'].includes(scope)) {
    res.status(400);
    res.json({
      error:             'invalid_scope',
      error_description: 'The "scope" parameter must be one of "admin", "public", or "user"',
    });
  }

  if (!req.query.client_id) {
    res.status(400);
    res.json({
      error:             'invalid_request',
      error_description: 'The "client_id" parameter must be provided.',
    });
  }

  if (!req.query.redirect_uri) {
    res.status(400);
    res.json({
      error:             'invalid_request',
      error_description: 'The "redirect_uri" parameter must be provided.',
    });
  }

  // attempt to retrieve the client and return error response if needed
  const client = await db.get(req.query.client_id)
  .catch(err => {

    if (err.code == 404) {

      res.status(400);
      res.json({
        error:             'invalid_request',
        error_description: 'No client with the specified ID was found.',
      });

    } else {

      res.status(500);
      res.json({
        error:             'server_error',
        error_description: 'There was an error retrieving information about the client.',
      });

    }

  });

  // stop execution if there was an error retrieving the client
  // (prevents a response from being sent twice)
  if (!client) return;

  // store the original authentication request
  const authReq = {
    originalUrl: req.originalUrl,
    ttl:         300, // 5 minutes
    type:        'authRequest',
  };

  const doc = await db.create(authReq)
  .catch(() => next(new Error('Unable to store authentication request.')));

  // stop execution if there was an error storing the authentication request
  // (prevents a response from being sent twice)
  if (!doc) return;

  // authentication options
  const opts = {
    audience: 'https://api.digitallinguistics.io/',
    state:    doc.id,
  };

  // authenticate the user with Auth0 and Passport (redirects to Auth0)
  passport.authenticate('auth0', opts)(req, res, next);

};

const errors = (err, req, res, next) => {

  const status = Number.isInteger(Number(err.status)) ? err.status : 500;
  const message = status < 500 ? err.message : statuses[err.status];

  const body = {
    message,
    status,
  };

  // handle JWT errors
  if (err.name === 'UnauthorizedError') {

    err.headers = {};
    err.headers['www-authenticate'] = `Bearer realm="DLx" error="invalid_token" error_description="${body.message}"`;
    body.code = err.code;
    body.name = err.name;

  // handle all other errors
  } else {

    Object.assign(body, err);

  }

  if (err.headers) res.set(err.headers);
  res.status(body.status);
  res.json(body);

};

const notFound = (req, res, next) => {
  res.status(404);
  res.json({
    message: 'No such route exists.',
    status:   404,
  });
};

const test = (req, res) => {
  res.status(200);
  res.json({
    message: 'Test successful.',
    status:   200,
  });
};

const token = (req, res) => {
  if (req.query.response_type === 'code') {
    // TODO: respond with the code (and save the auth request to the database)
  } else if (req.query.response_type === 'token') {
    // TODO: respond with the token (and store the token in the client, then save the client to the database)
  }
};

// EXPORTS
const routes = {
  auth,
  errors,
  notFound,
  test,
  token,
};

Object.assign(v0, routes);

module.exports = {
  auth,
  errors,
  notFound,
  test,
  token,
  v0,
};
