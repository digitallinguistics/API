const app = require('../app');
const req = require('supertest').agent(app);

// require('./authentication');
// require('./registration');
require('./rest')(req);
// require('./socket')(req);
