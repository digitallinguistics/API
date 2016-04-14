const dlxdb = require('dlx-documentdb');

const db = dlxdb({
  id: 'dlx',
  masterKey: process.env.DOCUMENTDB
});

module.exports = {};
