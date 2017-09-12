const config      = require('../../lib/config');
const { signJwt } = require('./jwt');

const payload = {
  azp:   config.authClientID,
  scope: `public`,
};

const opts = {
  audience: [`https://api.digitallinguistics.io/`],
  issuer:   `https://${config.authDomain}/`,
  subject:  config.testUser,
};

module.exports = () => signJwt(payload, config.authSecret, opts);
