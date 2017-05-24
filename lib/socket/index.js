const authorize    = require(`./authorize`);
const createSocket = require(`socket.io`);
const errors        = require(`./errors`);
const handle       = require(`./handlers`);

module.exports = server => {

  const opts = { transports: [`websocket`, `xhr-polling`] };
  const io   = createSocket(server, opts);

  io.on(`authenticated`, socket => console.log(`\nClient ${socket.client.id} authenticated.`));
  io.on(`connect`, socket => console.log(`\nClient ${socket.client.id} connected.`));
  io.on(`connect`, authorize);
  io.on(`connect`, errors);

  io.on(`authenticated`, socket => {

    const handlers = handle(socket);

    // TODO: add socket routes: socket.on(...)

  });

  return io;

};
