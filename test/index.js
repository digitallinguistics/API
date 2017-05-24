const app          = require(`../app`);
const rest         = require(`./rest`);
const restErrors   = require(`./rest-errors`);
const req          = require(`supertest`).agent(app);
const socketErrors = require(`./socket-errors`);

// test client registration and authentication (with Auth0)
// require(`./authentication`);
// require(`./registration`);

// test errors for for REST API
// restErrors(req);
// restErrors(req, `/v0`);

// test endpoints for REST API
// rest(req);
// rest(req, `/v0`);

// test errors for Socket API
socketErrors();
// socketErrors(`/v0`);
