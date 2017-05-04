const api    = require(`./api`);
const app    = require(`../app`);
const errors = require(`./errors`);
const req    = require(`supertest`).agent(app);

// test client registration and authentication (with Auth0)
require(`./authentication`);
require(`./registration`);

// test errors for for REST API
errors(req);
errors(req, `/v0`);

// test endpoints for REST API
api(req);
api(req, `/v0`);
