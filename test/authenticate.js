const config = require(`../lib/config`);
const io     = require(`socket.io-client`);

module.exports = (v = ``, token) => new Promise((resolve, reject) => {

  const socketOpts = { transports: [`websocket`, `xhr-polling`] };
  const client     = io(`${config.baseUrl}${v}`, socketOpts);

  client.on(`authenticated`, () => resolve(client));
  client.on(`connect`, () => client.emit(`authenticate`, { token }));
  client.on(`error`, reject);
  client.on(`unauthorized`, reject);

});
