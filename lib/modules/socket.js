const config        = require(`../config`);
const createSocket  = require(`socket.io`);
const { authorize } = require(`socketio-jwt`);

const fifteenSeconds = 15000;

const initialize = io => {
  io.on(`authenticated`, socket => console.log(`Client ${socket.client.id} authenticated.`));
  io.on(`connect`, socket => console.log(`Client ${socket.client.id} connected.`));
  io.on(`connect`, authorize({
    issuer:  `https://${config.authDomain}/`,
    secret:  config.authSecret,
    timeout: fifteenSeconds,
  }));
  return io;
};

module.exports = server => {

  const opts = { transports: [`websocket`, `xhr-polling`] };
  const io   = createSocket(server, opts);

  initialize(io);

  io.router = namespace => initialize(io.of(namespace));

  return io;

};
