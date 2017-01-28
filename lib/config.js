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
    process.env.DOMAIN = 'api.digitallinguistics.io';
    process.env.BASE_URL = `https://${process.env.DOMAIN}`;
    break;
  }
  case 'production': {
    process.env.DOMAIN = 'api.digitallinguistics.io';
    process.env.BASE_URL = `https://${process.env.DOMAIN}`;
    break;
  }
  default: {
    throw new Error('Unknown environment variable.');
  }
}

module.exports = {
  development: process.env.NODE_ENV === 'development',
  localhost:   process.env.NODE_ENV === 'localhost',
  production:  process.env.NODE_ENV === 'production',

  baseUrl:     process.env.BASE_URL,
  dbKey:       process.env.DOCUMENTDB_KEY,
  dbUrl:       process.env.DOCUMENTDB_URL,
  domain:      process.env.DOMAIN,
  env:         process.env.NODE_ENV,
  port:        process.env.PORT,
};

if (process.env.NODE_ENV !== 'production') {
  module.exports.cid     = process.env.CID;
  module.exports.jwtid   = process.env.JWTID;
  module.exports.secret  = process.env.SECRET;
  module.exports.subject = process.env.SUBJECT;
}
