/* eslint-disable
  func-style,
  require-jsdoc,
*/

const Auth0Strategy = require('passport-auth0');
const config        = require('./config');
const passport      = require('passport');

// configuration options for the Auth0 Passport strategy
const strategyConfig = {
  callbackURL:  config.authCb,
  clientID:     config.authId,
  clientSecret: config.authSecret,
  domain:       config.authDomain,
};

// configure Passport
passport.use(new Auth0Strategy(strategyConfig, verifyStrategy));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

// looks up the user from the database (not necessary here)
function deserializeUser(user, cb) {
  cb(null, user);
}

// takes a user profile and returns only the information to be saved to the session (not necessary here)
function serializeUser(user, cb) {
  cb(null, user);
}

/*
  This function is for looking up the user who possesses the given profile returned by Passport.
  Since Auth0 is where I'm storing user data, it doesn't need to be looked up.
  Auth0 has already provided me with the entire user profile.
  That user profile is therefore simply returned by the verifyStrategy function.
 */
function verifyStrategy(accessToken, refreshToken, extras, profile, cb) {
  return cb(null, profile);
}

module.exports = passport;
