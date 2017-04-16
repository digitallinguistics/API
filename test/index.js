const app  = require('../app');
const test = require('./test');
const req  = require('supertest').agent(app);

// run error tests on each API version
test(req);
test(req, '/v0');
