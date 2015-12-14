'use strict';

// private variables & functions

function createPublicMethods() {
  return new Promise(function (resolve) {
    Object.keys(db.globalProcs).forEach(proc => {
      database[proc] = function (items, coll, cb) {
        if (proc !== 'match') { items = toArray(items); }
        client.executeStoredProcedure(db[coll].procs[proc].link, [items], cb);
      };
    });
    resolve();
  });
}

function registerProcs() {
  return new Promise(function (resolve, reject) {
    var tnum = 0;

    db.collections.forEach(t => {

      Object.keys(db.globalProcs).forEach(p => {
        db[t].procs[p] = db.globalProcs[p];
      });

      Object.keys(db[t].procs).forEach(p => {
        client.upsertStoredProcedure(db[t].link, db[t].procs[p], function (err, res) {
          if (err) { reject(err); }
          else {
            db[t].procs[p].link = res._self;
            db[t].procs[p].rid = res._rid;
            tnum += 1;

            if (tnum === db.collections.length) { resolve(); }
          }
        });
      });

    });
  });
}

function validateEmail(email) {
  var regexp = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$', 'i');
  return regexp.test(email);
}

function User(data) {
  var id = ''; // also the user email

  this.accessToken = '';
  this.dlxToken = '';
  this.refreshToken = '';
  this.tokenExpiration = '';
  this.tokenService = '';

  this.affiliation = '';
  this.firstName = '';
  this.lastName = '';

  this.dropboxID = '';
  this.facebookID = '';
  this.instagramID = '';
  this.onedriveID = '';
  this.twitterID = '';

  if (data) {
    Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
    id = validateEmail(data.id || data.email) ? (data.id || data.email) : '';
  }

  Object.defineProperties(this, {
    'email': {
      enumerable: true,

      get: function () { return id; },

      set: function (val) { this.id = val; }
    },

    'id': {
      enumerable: true,

      get: function () { return id; },

      set: function (val) {
        if (!validateEmail(val)) { return new TypeError('Invalid email ID.'); }
        else { id = val; }
      }
    }
  });

}

// database schema
var db = {
  collections: ['texts', 'users'],

  globalProcs: {
    'delete': {
      id: 'delete',
      body: function del (ids) {
        var res = __.filter(function (doc) {
          return ids.indexOf(doc.id) !== -1;
        }, function (err, res) {
          if (err) { __.response.setBody(err); }
          else if (res.length === 0) { __.response.setBody({ code: 401, message: 'No documents to delete.' }); }
          else {
            res.forEach(function (doc, i, arr) {
              __.deleteDocument(doc._self, function (err) {
                if (err) {
                  __.response.setBody(err);
                  return;
                } else if (i === arr.length-1) {
                  __.response.setBody({ code: 200, message: 'Items deleted successfully.' });
                }
              });
            });
          }
        });

        if (!res.isAccepted) {
          __.response.setBody({ code: 500, message: 'Timeout deleting items.' });
        }
      }
    },

    'get': {
      id: 'get',
      body: function get (ids) {
        var res = __.filter(function (doc) {
          return ids.indexOf(doc.id) !== -1;
        }, function (err, results) {
          if (err) { __.response.setBody(err); }
          else { __.response.setBody(results); }
        });

        if (!res.isAccepted) { __.response.setBody({ code: 500, message: 'Timeout getting items.' }); }
      }
    },

    'match': {
      id: 'match',
      body: function match (criteria) {

        var matchCriteria = function (doc) {
          return Object.keys(criteria).every(function(key) { return doc[key] === criteria[key]; });
        };

        var res = __.filter(matchCriteria, function (err, results) {
          if (err) { __.response.setBody(err); }
          else { __.response.setBody(results); }
        });

        if (!res.isAccepted) { __.response.setBody({ code: 500, message: 'Timeout finding matches.' }); }
      }
    },

    'upsert': {
      id: 'upsert',
      body: function upsert (items) {
        var results = [];

        items.forEach(function (item, i, arr) {
          var upserted = __.upsertDocument(__.getSelfLink(), item, function (err, res) {
            if (err) { __.response.setBody(err); }
            else {
              results.push(res._rid);
              if (i === arr.length-1) { __.response.setBody(results); }
            }
          });

          if (!upserted) { __.response.setBody({ code: 500, message: 'Timeout upserting items.' }); }
        });
      }
    }
  },

  bundles: {
    procs: {}
  },

  languages: {
    procs: {}
  },

  lexicons: {
    procs: {}
  },

  media: {
    procs: {}
  },

  persons: {
    procs: {}
  },

  projects: {
    procs: {}
  },

  texts: {
    procs: {}
  },

  users: {
    private: true,
    procs: {}
  }

};

exports.getAll = function (coll) {
  return new Promise(function (resolve, reject) {
    client.readDocuments(db[coll].link).toArray(function (err, res) {
      if (err) { reject(err); }
      else { resolve(res); }
    });
  });
};

exports.getPermitted = function (userLink, coll, cb) {
  // get user
  // db.search/match > docs where user ID is included in permissions array, or doc is public
};

exports.getUser = function (userLink, cb) {
  client.readDocument(userLink, cb);
};

exports.createUser = function (attributes) {
  return new User(attributes);
};

// database initialization
initCollections()
  .then(registerProcs)
  .then(createPublicMethods)
  .then(test)
  .catch(logError);
