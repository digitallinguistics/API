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
  redirects:   ['http://localhost:3000/oauth'],
  scope:       'public',
  secret:       config.secret,
  type:        'client-app',
};
