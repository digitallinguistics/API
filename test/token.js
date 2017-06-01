const config = require(`../lib/config`);
const jwt    = require(`jsonwebtoken`);

module.exports = () => new Promise((resolve, reject) => {

  const payload = {
    azp:   config.authClientId,
    scope: `user`,
  };

  const opts = {
    audience: `https://api.digitallinguistics.io/`,
    issuer:   `https://${config.authDomain}/`,
    subject:  config.testUser,
  };

  jwt.sign(payload, config.authSecret, opts, (err, token) => {
    if (err) reject(err);
    else resolve(token);
  });

});
