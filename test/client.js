const config = require('../lib/config');

module.exports = {
  confidential: true,
  id:           config.cid,
  name:        'API Test App',
  permissions: {
    contributor: [],
    owner:       [],
    public:      false,
    viewer:      [],
  },
  redirects:   ['http://localhost:3000/oauth', 'http://localhost:3000/test/callback'],
  scope:       'user',
  secret:       config.secret,
  type:        'client',
};
