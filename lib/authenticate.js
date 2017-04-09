const createError     = require('http-errors');
const db              = require('./db');
const jwt             = require('express-jwt');
const wwwAuthenticate = require('./utils').wwwAuthenticate;

const tokenError = message => {
  const httpError = createError(401, message);
  httpError.headers = {};
  wwwAuthenticate(httpError.headers, message);
  return httpError;
};

module.exports = jwt({

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
