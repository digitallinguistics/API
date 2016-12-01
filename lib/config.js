const localPort = 3000;

process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
process.env.PORT = process.env.PORT || localPort;

if (process.env.NODE_ENV === 'localhost') require('../../credentials/dlx-api.js');

module.exports = {
  localhost:   process.env.NODE_ENV === 'localhost',
  development: process.env.NODE_ENV === 'development',
  production:  process.env.NODE_ENV === 'production',

  dbKey:      process.env.DOCUMENTDB_KEY,
  dbUrl:      process.env.DOCUMENTDB_URL,
  env:        process.env.NODE_ENV,
  port:       process.env.PORT,
};
