const RateLimit = require(`express-rate-limit`);

// 500 requests every 5 minutes
// (100 requests per minute)
module.exports = new RateLimit({
  delayAfter: 0,
  delayMs:    0,
  headers:    true,
  max:        500,
  windowMs:   300000, // 5 minutes
});
