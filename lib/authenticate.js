const createError = require('http-errors');
const db = require('./db');
const jwt = require('express-jwt');

module.exports = jwt({

  audience:            'https://api.digitallinguistics.io',
  issuer:              'https://login.digitallinguistics.io',
  requestProperty:     'token',
  credentialsRequired:  true,

  secret: (req, payload, done) => db.readDocument(`${db.coll}/${payload.cid}`, (err, clientApp) => {

    if (err && err.code == 404) {

      const httpError = createError(401, 'The client associated with the provided access token could not be found.');

      httpError.headers = { 'www-authenticate': `Bearer realm="DLx" error="invalid_token" error_description="${httpError.message}"` };

      done(httpError);

    } else if (err) {

      done(createError(500, 'There was a problem looking up the client associated with the provided access token.'));

    } else {

      done(null, clientApp.secret);

    }

  }),

});
