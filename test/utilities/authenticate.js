const config = require(`../../lib/config`);
const io     = require(`socket.io-client`);

module.exports = (v = ``, token) => new Promise((resolve, reject) => {

  const socketOpts = { transports: [`websocket`, `xhr-polling`] };
  const client     = io(`${config.baseURL}${v}`, socketOpts);

  client.on(`authenticated`, () => {

    client.emitAsync = (...args) => new Promise((resolve, reject) => {
      client.emit(...args, (err, res, info) => {
        if (err) return reject(err);
        resolve({ info, res });
      });
    });

    resolve(client);

  });
  client.on(`connect`, () => client.emit(`authenticate`, { token }));
  client.on(`error`, reject);
  client.on(`unauthorized`, reject);

});
