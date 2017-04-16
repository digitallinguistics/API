const app    = require('../app');
const req    = require('supertest').agent(app);
const socket = require('./socket');
const test   = require('./test');

// run error tests on each API version
test(req);
test(req, '/v0');

// run Socket.IO tests
socket();
socket(`/v0`);
