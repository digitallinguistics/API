const { authorize }  = require(`socketio-jwt`);
const config         = require(`../../config`);
const fifteenSeconds = 15000;

module.exports = authorize({
  issuer:  `https://${config.authDomain}/`,
  secret:  config.authSecret,
  timeout: fifteenSeconds,
});
