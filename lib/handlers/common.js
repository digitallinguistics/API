const config      = require('../config');
const db          = require('../db');
const http        = require('http');
const passport    = require('../passport');
const qs          = require('querystring');
const createToken = require('../token');

const fiveMinutes = 300;
const fourHours   = 14400;
const statuses    = http.STATUS_CODES;

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
    return;
  }

  if (scope === 'admin' || scope === 'public') {
    res.status(400);
    res.json({
      error:             'invalid_scope',
      error_description: `Requests for "${scope}" scope should use the Client Credentials Grant.`,
    });
    return;
  }

  if (scope !== 'user') {
    res.status(400);
    res.json({
      error:             'invalid_scope',
      error_description: 'The "scope" parameter must be set to "user"',
    });
    return;
  }

  if (!req.query.client_id) {
    res.status(400);
    res.json({
      error:             'invalid_request',
      error_description: 'The "client_id" parameter must be provided.',
    });
    return;
  }

  if (!req.query.redirect_uri) {
    res.status(400);
    res.json({
      error:             'invalid_request',
      error_description: 'The "redirect_uri" parameter must be provided.',
    });
    return;
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
    client,
    redirect_uri:  req.query.redirect_uri,
    response_type: req.query.response_type,
    scope,
    state:         req.query.state || '',
    ttl:           fiveMinutes,
    type:          'authRequest',
  };

  const doc = await db.create(authReq)
  .catch(() => {
    res.status(500);
    res.json({
      error:             'server_error',
      error_description: 'Unable to save authentication request to database.',
    });
  });

  // stop execution if there was an error storing the authentication request
  // (prevents a response from being sent twice)
  if (!doc) return;

  // authentication options
  const opts = { state: doc.id };

  // authenticate the user with Auth0 and Passport (redirects to Auth0)
  passport.authenticate('auth0', opts)(req, res, next);

};

// handler for testing the authentication process
const authTest = (req, res) => {

  const params = {
    client_id:     config.cid,
    redirect_uri:  `${config.baseUrl}/oauth`,
    response_type: 'code',
    state:         '12345',
  };

  const request = http.get(`${config.baseUrl}/auth?${qs.stringify(params)}`, response => {
    let data = '';
    response.on('error', err => res.send(err.message));
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      res.redirect(response.headers.location);
    });
  });

  request.on('error', err => res.send(err.message));

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

const oauth = async (req, res, next) => {

  const authRedirect = (authReq, parameters) => {
    const params = Object.assign({}, parameters);
    if (authReq.state) params.state = authReq.state;
    res.redirect(`${authReq.redirect_uri}?${qs.stringify(params)}`);
  };

  // lookup original authentication request
  const authReq = await db.get(req.query.state)
  .catch(() => {
    res.status(500);
    res.json({
      error:             'server_error',
      error_description: 'The original authentication request could not be retrieved.',
    });
  });

  if (!authReq) return;

  // if an error was received from the authentication provider,
  // redirect to client's redirect URI with the error message
  // NB: This will probably never happen, since Passport returns a 401 Unauthorized before reaching this handler
  if (req.query.error) {

    const params = {
      error:             req.query.error,
      error_description: req.query.error_description,
    };

    return authRedirect(authReq, params);

  }

  // return appropriate response based on response_type
  if (authReq.response_type === 'token') {

    // const token = await createToken(authReq.client, authReq.scope, req.user);
    const token = await createToken(authReq.client, authReq.scope, req.user)
    .catch(err => {

      const params = {};

      if (err.name === 'invalid_scope') {

        params.error             = err.name;
        params.error_description = err.message;

      } else {

        params.error             = 'server_error';
        params.error_description = 'Unable to create the access token.';

      }

      authRedirect(authReq, params);

    });

    // stop execution if token creation failed (prevents sending response twice)
    if (!token) return;

    const params = {
      access_token: token,
      expires_in:   fourHours,
      scope:        authReq.scope,
      token_type:   'bearer',
    };

    authRedirect(authReq, params);

  } else if (authReq.response_type === 'code') {

    const params = { code: authReq.id };
    authRedirect(authReq, params);

  } else {

    next(new Error('Unable to determine response_type.'));

  }

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

module.exports = {
  auth,
  authTest,
  errors,
  notFound,
  oauth,
  test,
  token,
};
