const createSocket = require(`socket.io`);

module.exports = server => {

  const opts = { transports: [`websocket`, `xhr-polling`] };
  const io   = createSocket(server, opts);

  return io;

};
