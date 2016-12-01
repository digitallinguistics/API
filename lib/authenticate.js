const createError = require('http-errors');
const db          = require('./db');
const jwt         = require('express-jwt');

const tokenError = message => {

  const httpError = createError(401, message);

  httpError.headers = {
    'www-authenticate': `Bearer realm="DLx" error="invalid_token" error_description="${message}"`,
  };

  return httpError;

};

module.exports = jwt({

  audience:            'https://api.digitallinguistics.io',
  issuer:              'https://login.digitallinguistics.io',
  requestProperty:     'token',
  credentialsRequired:  true,

  secret: (req, payload, done) => {

    if (!payload.cid) {

      done(tokenError('A client ID (cid) must be included in the token payload.'));

    } else {

      db.readDocument(`${db.coll}/docs/${payload.cid}`, (err, clientApp) => {

        if (err && err.code == 404) {

          done(tokenError('The client associated with the provided access token could not be found.'));

        } else if (err) {

          // Any other type of DocumentDB error
          done(createError(500, 'There was a problem looking up the client associated with the provided access token.'));

        } else if (clientApp.jwtid !== payload.jti) {

          done(tokenError('The JSON Web Token ID is invalid.'));

        } else {

          done(null, clientApp.secret);

        }

      });

    }

  },

});
