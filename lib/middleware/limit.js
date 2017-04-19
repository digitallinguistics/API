const RateLimit = require(`express-rate-limit`);

// 500 requests per minute
module.exports = new RateLimit({
  delayAfter: 0,
  delayMs:    0,
  headers:    true,
  max:        500,
  windowMs:   60000,
});
