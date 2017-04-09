const app    = require('../app');
const auth   = require('./auth');
const errors = require('./errors');
const req    = require('supertest').agent(app);

// run error tests on each API version
errors(req);
errors(req, '/v0');

// run auth tests
auth(req);
