const localPort = 3000;

process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
process.env.PORT = process.env.PORT || localPort;

switch (process.env.NODE_ENV) {
  case 'localhost': {
    require('../../credentials/dlx-api.js');
    process.env.DOMAIN = 'localhost';
    process.env.BASE_URL = `http://${process.env.DOMAIN}:${process.env.PORT}`;
    break;
  }
  case 'development': {
    process.env.DOMAIN = 'dlx-api.azurewebsites.net';
    process.env.BASE_URL = `https://${process.env.DOMAIN}`;
    break;
  }
  case 'production': {
    process.env.DOMAIN = 'dlx-api.azurewebsites.net';
    process.env.BASE_URL = `https://${process.env.DOMAIN}`;
    break;
  }
  default: {
    throw new Error('Unknown environment variable.');
  }
}

module.exports = {
  localhost:   process.env.NODE_ENV === 'localhost',
  development: process.env.NODE_ENV === 'development',
  production:  process.env.NODE_ENV === 'production',

  baseUrl:     process.env.BASE_URL,
  dbKey:       process.env.DOCUMENTDB_KEY,
  dbUrl:       process.env.DOCUMENTDB_URL,
  domain:      process.env.DOMAIN,
  env:         process.env.NODE_ENV,
  port:        process.env.PORT,
};
