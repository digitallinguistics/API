const authenticate = require(`./middleware/authenticate`);
const authorize    = require(`./middleware/authorize`);
const error        = require(`./middleware/error`);
const handle       = require(`./handlers`);
const logger       = require(`./middleware/logger`);

module.exports = io => {

  io.on(`authenticated`, socket => console.log(`\nClient ${socket.client.id} authenticated.`));
  io.on(`connect`, socket => console.log(`\nClient ${socket.client.id} connected.`));
  io.on(`connect`, logger);
  io.on(`connect`, authorize);
  io.on(`connect`, authenticate);

  io.on(`authenticated`, socket => {

    const handlers = handle(socket);
    socket.use(error(handlers)); // 404 event handler

    socket.on(`add`, handlers.add);
    socket.on(`delete`, handlers.delete);
    socket.on(`destroy`, handlers.destroy);
    socket.on(`get`, handlers.get);
    socket.on(`getAll`, handlers.getAll);
    socket.on(`update`, handlers.update);
    socket.on(`upsert`, handlers.upsert);

  });

  return io;

};
