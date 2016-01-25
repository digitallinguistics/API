var credentials = require('./credentials');
var DocumentDB = require('documentdb');
var User = require('./models/user');
var uuid = require('uuid');

var documentdb = new DocumentDB.DocumentClient(credentials.documentdb.host, { masterKey: credentials.documentdb.key });

var db = (() => {

  this.id = global.env === 'production' ? credentials.documentdb.link : credentials.documentdb.devLink;
  this.link = (() => { return 'dbs/' + this.id + '/'; })();

  this.sprocs = {
    deleteItemsByIds: {
      id: 'deleteItemsByIds',
      serverScript: function (ids) {

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

        var response = __.response;

        var filter = function (doc) { return ids.includes(doc.id); };

        var accepted = __.filter(filter, function (err, res) {
          if (err) { throw new Error(err); }
          else {
            if (res.length === 0) { throw new ReferenceError('No item exists with that ID.'); }
            else {
              var accepted = __.deleteDocument(res[0]._self, function (err, res) {
                if (err) { throw new Error(err); }
                else { response.setBody(res); }
              });
              if (!accepted) { throw new Error('Timeout deleting item.'); }
            }
          }
        });

        if (!accepted) { throw new Error('Timeout deleting items.'); }
      }
    },

    getItemsByIds: {

      id: 'getItemsByIds',
      serverScript: function (ids, getBy, options) {

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
          else {
            results = results.concat(res);
            if (opts.continuation) {
              var queryResponse = __.filter(filter, { continuation: opts.continuation }, processResults);
              if (!queryResponse.isAccepted) { throw new Error('Timeout getting items.'); }
            } else { response.setBody(results); }
          }
        };

        switch (getBy) {
          case 'serviceId':
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

  this.initCollections = () => new Promise((resolve, reject) => {
    documentdb.readCollections(db.link).toArray((err, collections) => {
      if (err) { reject(err); }

      collections.forEach(coll => {

        db[coll.id] = {
          link: coll._self,
          rid: coll._rid,
          sprocs: {}
        };

        const checkCounter = () => new Promise((resolve, reject) => {
          const readCounter = () => new Promise((resolve, reject) => {
            documentdb.executeStoredProcedure(db[coll.id].sprocs.getItemsByIds.link, [['counter'], 'id'], (err, res) => {
              if (err) { reject(err); }
              else { resolve(res); }
            });
          });

          const uploadCounter = res => new Promise((resolve, reject) => {
            if (res.length === 0) {
              const counterDoc = { id: 'counter', counter: 0, services: {} };
              documentdb.createDocument(db[coll.id].link, counterDoc, (err, res) => {
                if (err) { reject(err); }
                else {
                  db[coll.id].counterLink = res._self;
                  resolve(res);
                }
              });
            } else {
              db[coll.id].counterLink = res[0]._self;
              resolve();
            }
          });

          readCounter()
          .then(uploadCounter)
          .then(resolve)
          .catch(reject);

        });

        const uploadSprocs = () => new Promise((resolve, reject) => {
          Object.keys(db.sprocs).forEach((sprocName, i, arr) => {
            documentdb.upsertStoredProcedure(db[coll.id].link, db.sprocs[sprocName], (err, res) => {
              if (err) { reject(err); }
              else {
                db[coll.id].sprocs[sprocName] = { link: res._self, rid: res._rid };
                if (i === arr.length-1) { resolve(); }
              }
            });
          });
        });

        uploadSprocs()
        .then(checkCounter)
        .then(resolve)
        .catch(reject);

      });

    });
  });

  this.ready = () => new Promise((resolve, reject) => {
    db.initCollections()
    .then(resolve)
    .catch(reject);
  });

  return this;

})();

const createId = coll => new Promise((resolve, reject) => {

  const getCounter = () => new Promise((resolve, reject) => {
    documentdb.readDocument(db[coll].counterLink, (err, res) => {
      if (err) { reject(err); }
      else { resolve(res); }
    });
  });

  const increment = counterDoc => new Promise((resolve, reject) => {
    counterDoc.counter++;
    documentdb.upsertDocument(db[coll].link, counterDoc, (err, res) => {
      if (err) { reject(err); }
      else { resolve(String(res.counter)); }
    });
  });

  getCounter()
  .then(increment)
  .then(resolve)
  .catch(reject);

});

exports.createApp = appName => new Promise((resolve, reject) => {

  const app = {
    id: uuid.v4(),
    appName: appName
  };

  documentdb.createDocument(db.apps.link, app, (err, res) => {
    if (err) { reject(err); }
    resolve(res);
  });

});

exports.deleteByIds = (coll, ids) => new Promise((resolve, reject) => {
  documentdb.executeStoredProcedure(db[coll].sprocs.deleteItemsByIds.link, [ids], (err, res) => {
    if (err) { reject(err); } else if (res) { resolve(); }
  });
});

exports.get = link => new Promise ((resolve, reject) => {
  documentdb.readDocument(link, (err, res) => {
    if (err) { reject(err); }
    else { resolve(res); }
  });
});

exports.getAppById = appId => new Promise((resolve, reject) => {
  documentdb.executeStoredProcedure(db.apps.sprocs.getItemsByIds.link, [[appId]], (err, res) => {
    if (err) { reject(err); }
    else if (!(res instanceof Array)) { reject(r.json('There was a problem retrieving information for this application ID.')); }
    else if (res.length === 0) { reject(r.json('An application with this ID was not found.', 404)); }
    else { resolve(res[0]); }
  });
});

exports.getById = (coll, id) => new Promise((resolve, reject) => {
  documentdb.executeStoredProcedure(db[coll].sprocs.getItemsByIds.link, [[id], 'id'], (err, res) => {
    if (err) { reject(err); } else { resolve(res[0]); }
  });
});

exports.getUser = rid => new Promise((resolve, reject) => {
  const link = db.users.link + 'docs/' + rid + '/';
  documentdb.readDocument(link, (err, res) => {
    if (err) { reject(err); } else { resolve(new User(res)); }
  });
});

exports.getUserById = (id, service) => new Promise((resolve, reject) => {

  const getBy = validateEmail(id) ? 'id' : 'serviceId';

  documentdb.executeStoredProcedure(db.users.sprocs.getItemsByIds.link, [[id], getBy, { service: service }], (err, res) => {
    if (err) { reject(err); }
    else if (!(res instanceof Array)) { reject(r.json('There was a problem retrieving information for the requested user.')); }
    else if (res.length === 0) { reject(r.json(`No user found with the given ID. <a class=link href=/login>Try logging in with a different service</a>, or <a class=link href=/login?register=true>create a new account</a>.`, 404)); }
    else { resolve(new User(res[0])); }
  });

});

exports.registerUser = userInfo => new Promise((resolve, reject) => {

  const user = new User(userInfo);

  documentdb.createDocument(db.users.link, user, (err, res) => {
    if (err) {
      switch (err.code) {
        case 409: reject(r.json(`A user with this email already exists. <a class=link href=/login>Try logging in with a different service.</a>`, 409)); break;
        default: reject(r.json(err));
      }
    } else {
      resolve(new User(res));
    }
  });

});

exports.updateUser = user => new Promise((resolve, reject) => {
  documentdb.upsertDocument(db.users.link, user, (err, res) => {
    if (err) { reject(err); } else { resolve(new User(res)); } });
});

exports.upsert = (coll, input) => new Promise((resolve, reject) => {
  const isArr = input instanceof Array;
  const items = isArr ? input : [input];
  const results = [];
  items.forEach((item, i, arr) => {

    const upsert = id => new Promise((resolve, reject) => {
      item.id = item.id || id;
      documentdb.upsertDocument(db[coll].link, item, (err, res) => {
        if (err) { reject(err); }
        else {
          results.push(res);
          if (i === arr.length-1) { resolve((isArr ? results : results[0])); }
        }
      });
    });

    if (!item.id) { createId(coll).then(upsert).then(resolve).catch(reject); }
    else { upsert().then(resolve).catch(reject); }

  });

});

exports.ready = db.ready;
