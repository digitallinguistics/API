const app          = require('../app');
const req          = require('supertest').agent(app);
const socket       = require('./socket');
const socketErrors = require('./socket-errors');

require('./authentication');
require('./registration');
require('./rest')(req);

socketErrors();
socketErrors(`/v0`);

socket(req);
socket(req, `/v0`);
