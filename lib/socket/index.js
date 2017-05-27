const config       = require(`../config`);
const createSocket = require(`socket.io`);
const redis        = require('redis').createClient;
const redisAdapter = require(`socket.io-redis`);

module.exports = server => {

  const opts = { transports: [`websocket`, `xhr-polling`] };
  const io   = createSocket(server, opts);

  const pubClient = redis(config.redisPort, config.redisHost, {
    auth_pass: config.redisKey,
    tls: { servername: config.redisHost },
  });

  const subClient = redis(config.redisPort, config.redisHost, {
    auth_pass: config.redisKey,
    tls: { servername: config.redisHost },
  });

  io.adapter(redisAdapter({
    pubClient,
    subClient,
  }));

  io.of(`/`).adapter.on(`error`, console.error);
  io.on(`connect`, socket => console.log(`\nClient ${socket.client.id} connected.`));

  return io;

};
