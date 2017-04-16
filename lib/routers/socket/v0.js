const handlers = require('../../handlers/socket/v0');

module.exports = io => {
  io.on(`connect`, socket => {

    socket.on(`test`, handlers.test);

  });
};
