const handlers = require(`../handlers/socket-handlers`);

module.exports = io => {
  io.on(`connect`, socket => {

    socket.on(`test`, handlers.test);

  });
};
