var database = module.exports;

// node modules
var env = require('./env');
var credentials = require('./credentials');
var documentdb = require('documentdb').DocumentClient;
var User = require('./User');

// initialize DocumentDB client
var client = new documentdb(credentials.documentdb.host, { "masterKey": credentials.documentdb.key });


// private functions and variables

// initializes collections in the database schema
var initCollections = function () {
  return new Promise(function (resolve, reject) {
    client.readCollections(db.link).toArray(function (err, res) {
      if (err) { reject(err); }
      var collections = res;

      collections.forEach(coll => {
        db[coll.id] = {
          id: coll.id,
          link: coll._self,
          rid: coll._rid
        };
      });

      resolve();

    });
  });
};

// logs errors in a Promise chain
var logErrors = function (err) {
  console.error(err);
  throw new Error(err);
};


// initialize database schema
var db = (function () {
  var rid = env.dev ? 'ocReAA==' : 'uqRoAA==';

  return {
    id: env.dev ? 'dlx-dev' : 'dlx',
    link: 'dbs/' + rid + '/',
    rid: rid
  };
})();


// public methods

// retrieves user based on session info
exports.getSessionUser = function (session) {
  return new Promise(function (resolve) {
    var user = new User();
    resolve(user);
  });
};


// initialize db module
initCollections()
  .catch(logErrors);
