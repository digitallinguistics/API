/* eslint-disable
  camelcase,
  func-names,
  max-nested-callbacks,
  max-statements-per-line,
  prefer-arrow-callback,
*/

const config = require(`../lib/config`);
const https  = require(`https`);
const io     = require(`socket.io-client`);

const getToken = () => new Promise((resolve, reject) => {

  const body = {
    audience:      `https://api.digitallinguistics.io/`,
    client_id:     config.authClientId,
    client_secret: config.authClientSecret,
    grant_type:    `client_credentials`,
  };

  const requestOpts = {
    headers:  { 'Content-Type': `application/json` },
    hostname: config.authDomain,
    method:   `POST`,
    path:     `/oauth/token`,
  };

  const request = https.request(requestOpts, response => {
    let data = ``;
    response.on(`data`, chunk => { data += chunk; });
    response.on(`error`, reject);
    response.on(`end`, () => {
      const tokenData = JSON.parse(data);
      resolve(tokenData.access_token);
    });
  });

  request.on(`error`, reject);
  request.end(JSON.stringify(body), `utf8`);

});

module.exports = (v = ``) => {

  const authenticate = token => new Promise((resolve, reject) => {

    const socketOpts = { transports: [`websocket`, `xhr-polling`] };
    const client     = io.connect(`http://localhost:3000${v}`, socketOpts);

    client.on(`authenticated`, () => resolve(client));
    client.on(`connect`, () => client.emit(`authenticate`, { token }));
    client.on(`error`, reject);
    client.on(`unauthorized`, reject);

    resolve(client);

  });

  describe(`Socket.IO`, function() {

    beforeAll(function(done) {
      getToken()
      .then(authenticate)
      .then(client => { this.client = client; })
      .then(done)
      .catch(fail);
    });

    it(`echoes test data`, function(done) {

      const testData = `test data`;

      this.client.emit(`test`, testData, res => {
        expect(res).toBe(testData);
        done();
      });

    });

  });

};
