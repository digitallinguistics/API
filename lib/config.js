const localPort = 3000;

process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
process.env.PORT     = process.env.PORT || localPort;

if (process.env.NODE_ENV === 'localhost') {
  require('../../credentials/dlx-api.js');
  process.env.DOMAIN   = 'localhost';
  process.env.BASE_URL = `http://${process.env.DOMAIN}:${process.env.PORT}`;
} else {
  process.env.DOMAIN   = 'api.digitallinguistics.io';
  process.env.BASE_URL = `https://${process.env.DOMAIN}`;
  process.env.CERT     = fs.readFileSync('../../.ssh/digitallinguistics.io.pub', 'utf8');
  process.env.KEY      = fs.readFileSync('../../.ssh/digitallinguistics.io.key', 'utf8');
}

switch (process.env.NODE_ENV) {
  case 'localhost': {
    break;
  }
  case 'development': {
    break;
  }
  case 'production': {
    process.env.DOMAIN   = 'api.digitallinguistics.io';
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

  authCb:      process.env.AUTH0_CALLBACK,
  authDomain:  process.env.AUTH0_DOMAIN,
  authId:      process.env.AUTH0_ID,
  authSecret:  process.env.AUTH0_SECRET,
  baseUrl:     process.env.BASE_URL,
  cert:        process.env.CERT,
  dbKey:       process.env.DOCUMENTDB_KEY,
  dbUrl:       process.env.DOCUMENTDB_URL,
  domain:      process.env.DOMAIN,
  env:         process.env.NODE_ENV,
  key:         process.env.KEY,
  port:        process.env.PORT,
};

if (process.env.NODE_ENV !== 'production') {
  module.exports.cid     = process.env.CID;
  module.exports.secret  = process.env.SECRET;
}
