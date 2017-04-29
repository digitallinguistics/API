/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const app          = require(`../app`);
const req          = require(`supertest`).agent(app);
const rest         = require(`./rest`);
const restErrors   = require(`./rest-errors`);
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

// test events for Socket API
