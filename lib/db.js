var credentials = require('./credentials');
var DocumentDB = require('documentdb');

var documentdb = new DocumentDB.DocumentClient(credentials.documentdb.host, { masterKey: credentials.documentdb.key });

var db = (() => {

  this.id = (global.env === 'local' || 'development') ? credentials.documentdb.devLink : credentials.documentdb.link;
  this.link = (() => { return 'dbs/' + this.id + '/'; })();

  this.sprocs = {
    getItemsByIds: {
      id: 'getItemsByIds',
      serverScript: function (ids) {

        if (!Array.prototype.includes) {
          Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
            'use strict';
            var O = Object(this);
            var len = parseInt(O.length) || 0;
            if (len === 0) {
              return false;
            }
            var n = parseInt(arguments[1]) || 0;
            var k;
            if (n >= 0) {
              k = n;
            } else {
              k = len + n;
              if (k < 0) {k = 0;}
            }
            var currentElement;
            while (k < len) {
              currentElement = O[k];
              if (searchElement === currentElement ||
                 (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                return true;
              }
              k++;
            }
            return false;
          };
        }

        var response = __.response();
        var results = [];

        var filter;

        response.setBody(__.getCollection());


      }
    }
  };


  this.initCollections = () => {
    return new Promise((resolve, reject) => {
      documentdb.readCollections(db.link).toArray((err, collections) => {
        if (err) { reject(err); }

        collections.forEach(coll => {
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

exports.ready = db.ready;
