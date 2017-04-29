/* eslint-disable
  func-names,
  max-nested-callbacks,
  max-statements,
  newline-per-chained-call,
  no-magic-numbers,
  no-shadow,
  prefer-arrow-callback
*/

const app    = require(`../app`);
const errors = require(`./errors`);
const req    = require(`supertest`).agent(app);
const api = require(`./api`);
const socket = require(`./socket`);

// require(`./authentication`);
// require(`./registration`);

// run error tests
// errors(req);
// errors(req, `/v0`);

// run routes tests
// api(req);
// api(req, `/v0`);

// run Socket.IO tests
socket();
// socket(`/v0`);
