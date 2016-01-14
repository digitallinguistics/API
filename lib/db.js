var credentials = require('./credentials');
var DocumentDB = require('documentdb');
var User = require('./user');

var documentdb = new DocumentDB.DocumentClient(credentials.documentdb.host, { masterKey: credentials.documentdb.key });

var db = (() => {

  this.id = (global.env === 'local' || 'development') ? credentials.documentdb.devLink : credentials.documentdb.link;
  this.link = (() => { return 'dbs/' + this.id + '/'; })();

  this.sprocs = {
    getItemsByIds: {
      id: 'getItemsByIds',
      serverScript: function (ids, collection, options) {

        if (!Array.prototype.includes) {
          Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
            'use strict';
            var O = Object(this);
            var len = parseInt(O.length) || 0;
            if (len === 0) { return false; }
            var n = parseInt(arguments[1]) || 0;
            var k;
            if (n >= 0) { k = n; }
            else { k = len + n; if (k < 0) {k = 0;} }
            var currentElement;
            while (k < len) {
              currentElement = O[k];
              if (searchElement === currentElement || (searchElement !== searchElement && currentElement !== currentElement)) { /* NaN !== NaN */ return true; }
              k++;
            }
            return false;
          };
        }

        var filter,
          response = __.response,
          results = [];

        var processResults = function (err, res, opts) {
          if (err) { throw new Error(err); }
          results = results.concat(res);
          if (opts.continuation) {
            var queryResponse = __.filter(filter, { continuation: opts.continuation }, processResults);
            if (!queryResponse.isAccepted) { throw new Error('Timeout getting items.'); }
          } else {
            response.setBody(results);
          }
        };

        switch (collection) {
          case 'users':
            filter = function (user) { return ids[0] === user.services[options.service]; };
            break;
          default:
            filter = function (doc) { return ids.includes(doc.id); };
        }

        var accepted = __.filter(filter, processResults);
        if (!accepted) { throw new Error('Timeout getting items.'); }


      }
    }
  };


  this.initCollections = () => {
    return new Promise((resolve, reject) => {
      documentdb.readCollections(db.link).toArray((err, collections) => {
        if (err) { reject(err); }

        collections.forEach(coll => {

          db[coll.id] = {
            link: coll._self,
            rid: coll._rid,
            sprocs: {}
          };

          Object.keys(db.sprocs).forEach((sprocName, i, arr) => {
            documentdb.upsertStoredProcedure(db[coll.id].link, db.sprocs[sprocName], (err, res) => {
              if (err) { reject(err); }
              db[coll.id].sprocs[sprocName] = { link: res._self, rid: res._rid };
              if (i === arr.length-1) { resolve(); }
            });
          });

        });

      });
    });
  };

  this.ready = () => {
    return new Promise((resolve, reject) => {
      db.initCollections()
      .then(resolve)
      .catch(reject);
    });
  };

  return this;

})();

exports.get = (link) => {
  return new Promise ( (resolve, reject) => {
    documentdb.readDocument(link, (err, res) => {
      if (err) { reject(err); }
      resolve(res);
    });
  });
};

exports.getUserById = (userId, service) => {
  return new Promise((resolve, reject) => {
    documentdb.executeStoredProcedure(db.users.sprocs.getItemsByIds.link, [[userId], 'users', { service: service }], (err, res) => {
      if (err) { reject(err); }
      if (!res[0]) { reject({ code: 404, message: 'No user found with the given service ID.' }); }
      resolve(res[0]);
    });
  });
};

exports.registerUser = (userInfo) => {
  return new Promise((resolve, reject) => {

    const user = new User(userInfo);

    documentdb.createDocument(db.users.link, user, (err, res) => {
      if (err) { reject(err); }
      resolve(res);
    });

  });
};

exports.ready = db.ready;
