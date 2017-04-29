const addTokenCheck = require(`../middleware/socket-error`);
const authorize     = require(`../middleware/authenticate-socket`);
const handlers      = require(`../handlers/socket-handlers`);

module.exports = io => {

  io.on(`authenticated`, socket => console.log(`\nClient ${socket.client.id} authenticated.`));
  io.on(`connect`, socket => console.log(`\nClient ${socket.client.id} connected.`));
  io.on(`connect`, addTokenCheck);
  io.on(`connect`, authorize);

  io.on(`authenticated`, socket => {

    socket.on(`test`, handlers.test);

  });

};
