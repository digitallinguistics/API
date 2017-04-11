const db          = require('./db');
const createError = require('./error');
const jwt         = require('express-jwt');

const createHeaders = message => ({ 'www-authenticate': `Bearer realm="DLx" error="invalid_token" error_description="${message}"` });

module.exports = jwt({

  audience:            'https://api.digitallinguistics.io/',
  credentialsRequired:  true,
  issuer:              'https://api.digitallinguistics.io/',
  requestProperty:     'token',

  secret: async (req, payload, done) => {

    if (payload.cid) {

      const client = await db.get(payload.cid)
      .catch(err => {

        if (err.code == 404) {

          const message = 'A client with the provided ID could not be found.';
          done(createError(400, 'invalid_token', message, { headers: createHeaders(message) }));

        } else {

          const message = 'There was an error looking up the client.';
          done(createError(500, 'server_error', message, { headers: createHeaders(message) }));

        }

      });

      if (client) done(null, client.secret);

    } else {

      const message = 'A client ID ("cid") must be included in the token payload.';
      done(createError(401, 'invalid_token', message, { headers: createHeaders(message) }));

    }

  },

});
