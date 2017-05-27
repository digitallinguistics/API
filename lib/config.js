const fs = require(`fs`);

const localPort = 3000;

process.env.NODE_ENV = process.env.NODE_ENV || `localhost`;
process.env.PORT     = process.env.PORT || localPort;

switch (process.env.NODE_ENV) {
  case `localhost`:
    require(`../../credentials/api.js`);
  // fallthrough
  case `development`:
    process.env.DOMAIN   = `localhost`;
    process.env.BASE_URL = `http://${process.env.DOMAIN}:${process.env.PORT}`;
    break;
  case `production`:
    process.env.DOMAIN   = process.env.HOSTNAME || `api.digitallinguistics.io`;
    process.env.BASE_URL = `https://${process.env.DOMAIN}`;
    process.env.CERT     = fs.readFileSync(`../../.ssh/digitallinguistics.io.pub`, `utf8`);
    process.env.KEY      = fs.readFileSync(`../../.ssh/digitallinguistics.io.key`, `utf8`);
    break;
  default:
    throw new Error(`Unknown environment variable.`);
}

module.exports = {

  localhost:   process.env.NODE_ENV === `localhost`,
  development: process.env.NODE_ENV === `development`,
  production:  process.env.NODE_ENV === `production`,

  authClientId:     process.env.AUTH0_CLIENT_ID,
  authClientSecret: process.env.AUTH0_CLIENT_SECRET,
  authDomain:       process.env.AUTH0_DOMAIN,
  authSecret:       process.env.AUTH0_SIGNING_SECRET,
  baseUrl:          process.env.BASE_URL,
  cert:             process.env.CERT,
  dbKey:            process.env.DOCUMENTDB_KEY,
  dbUrl:            process.env.DOCUMENTDB_URL,
  domain:           process.env.DOMAIN,
  env:              process.env.NODE_ENV,
  key:              process.env.KEY,
  port:             process.env.PORT,
  redisHost:        process.env.REDIS_HOST,
  redisKey:         process.env.REDIS_KEY,
  redisPort:        process.env.REDIS_PORT,
  testUser:         process.env.TEST_USER,

};
