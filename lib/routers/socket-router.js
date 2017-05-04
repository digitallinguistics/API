const errors    = require(`../middleware/socket-error`);
const authorize = require(`../middleware/authenticate-socket`);
const handle    = require(`../handlers/socket-handlers`);

module.exports = io => {

  io.on(`authenticated`, socket => console.log(`\nClient ${socket.client.id} authenticated.`));
  io.on(`connect`, socket => console.log(`\nClient ${socket.client.id} connected.`));
  io.on(`connect`, authorize);
  io.on(`connect`, errors);

  io.on(`authenticated`, socket => {

    const handlers = handle(socket);

    socket.on(`get:language`, handlers.get);
    socket.on(`test`, handlers.test);

  });

};
