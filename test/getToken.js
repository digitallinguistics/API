const config = require(`../lib/config`);
const https  = require(`https`);

module.exports = () => new Promise((resolve, reject) => {

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
