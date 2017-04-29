const config = require('../config');
const jwt    = require('express-jwt');

const isRevoked = (req, payload, done) => {
  if (payload.sub) done(null, false);
  else done(null, true);
};

module.exports = jwt({
  audience:             [`https://api.digitallinguistics.io/`],
  credentialsRequired:  true,
  isRevoked,
  issuer:              `https://${config.authDomain}/`,
  requestProperty:     `token`,
  secret:              config.authSecret,
});
