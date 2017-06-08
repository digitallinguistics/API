const jwt  = require('jsonwebtoken');
const { promisify } = require('util');

module.exports = {
  signJwt:   promisify(jwt.sign),
  verifyJwt: promisify(jwt.verify),
};
