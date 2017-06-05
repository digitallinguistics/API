const app          = require(`../app`);
const rest         = require(`./rest`);
const restErrors   = require(`./rest-errors`);
const req          = require(`supertest`).agent(app);
const socket       = require(`./socket`);
const socketErrors = require(`./socket-errors`);

require(`./authentication`);
require(`./registration`);

restErrors(req);
restErrors(req, `/v0`);

rest(req);
rest(req, `/v0`);
//
socketErrors();
socketErrors(`/v0`);
//
socket(req);
socket(req, `/v0`);
