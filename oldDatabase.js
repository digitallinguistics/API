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



// database schema
var db = {
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
