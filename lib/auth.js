/* eslint-disable
  camelcase,
  func-style,
  require-jsdoc,
*/

const createError         = require('http-errors');
const db                  = require('./db');
const jwt                 = require('express-jwt');
const { wwwAuthenticate } = require('./utils');

const authenticateToken = jwt({

  audience:            'https://api.digitallinguistics.io',
  credentialsRequired:  true,
  issuer:              'https://login.digitallinguistics.io',
  requestProperty:     'token',

  secret: (req, payload, done) => {

    if (payload.cid) {

      db.readDocument(`${db.coll}/docs/${payload.cid}`, (err, client) => {
        if (err && err.code == 404) {
          done(tokenError('The client associated with the provided access token could not be found.'));
        } else if (err) {
          done(createError(500, 'There was a problem looking up the client associated with the provided access token.'));
        } else {
          done(null, client.secret);
        }
      });

    } else {

      done(tokenError('A client ID ("cid") must be included in the token payload.'));

    }

  },

});

const authRequest = (req, res) => {

  // check for errors with query parameters

  if (!['code', 'token'].includes(req.query.response_type)) {
    res.status(400);
    res.json({
      error:             'unsupported_response_type',
      error_description: 'The "response_type" parameter must be either "code" or "token".',
    });
  }

  if (req.query.scope && !['admin', 'public', 'user'].includes(req.query.scope)) {
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

  getClient(req.query.client_id)
  .then(client => {

    if (req.query.response_type === 'code') {
      // TODO: respond with the code (and save the auth request to the database)
    } else if (req.query.response_type === 'token') {
      // TODO: respond with the token (and store the token in the client, then save the client to the database)
    }

  })
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

};

function getClient(cid) {
  return new Promise((resolve, reject) => {

    db.readDocument(`${db.coll}/docs/${cid}`, (err, client) => {
      if (err) reject(err);
      else resolve(client);
    });

  });
}

function tokenError(message) {
  const httpError = createError(401, message);
  httpError.headers = {};
  wwwAuthenticate(httpError.headers, message);
  return httpError;
}

const tokenRequest = (req, res) => {};

module.exports = {
  authenticateToken,
  authRequest,
  tokenRequest,
};
