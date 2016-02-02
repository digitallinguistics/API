var credentials = require('./credentials');
var DocumentDB = require('documentdb');

var documentdb = new DocumentDB.DocumentClient(credentials.documentdb.host, { masterKey: credentials.documentdb.key });

var db = (() => {

  this.rid = global.env === 'production' ? credentials.documentdb.rid : credentials.documentdb.devRid;
  this.link = (() => 'dbs/' + this.rid + '/')();

  this.sprocs = {
    getItemsByIds: require('./sprocs/getItemsByIds')
  };

  this.initCollections = () => new Promise((resolve, reject) => {
    documentdb.readCollections(this.link).toArray((err, collections) => {
      if (err) { reject(r.convert(err)); }
      else {
        collections.forEach((coll, i, arr) => {

          this[coll.id] = {
            link: coll._self,
            rid: coll._rid,
            sprocs: {}
          };

          const checkCounter = () => new Promise((resolve, reject) => {

            const readCounter = () => new Promise((resolve, reject) => {
              documentdb.executeStoredProcedure(this[coll.id].sprocs.getItemsByIds.link, [['counter'], 'id'], (err, res) => {
                if (err) { reject(r.convert(err)); } else { resolve(res); }
              });
            });

            const uploadCounter = res => new Promise((resolve, reject) => {
              if (res.length === 0) {
                const counterDoc = { id: 'counter', counter: 0, services: {}, permissions: {} };
                documentdb.createDocument(this[coll.id].link, counterDoc, (err, res) => {
                  if (err) { reject(r.convert(err)); }
                  else { this[coll.id].counterLink = res._self; resolve(res); }
                });
              } else { this[coll.id].counterLink = res[0]._self; resolve(); }
            });

            readCounter().then(uploadCounter).then(resolve).catch(reject);

          });

          const uploadSprocs = () => new Promise((resolve, reject) => Object.keys(this.sprocs).forEach((sprocName, i, arr) => {
            documentdb.upsertStoredProcedure(this[coll.id].link, this.sprocs[sprocName], (err, res) => {
              if (err) { reject(r.convert(err)); }
              else {
                this[coll.id].sprocs[sprocName] = { link: res._self, rid: res._rid };
                if (i === arr.length-1) { resolve(); }
              }
            });
          }));

          uploadSprocs().then(checkCounter).then(() => {
            if (i === arr.length-1) { resolve(); }
          }).catch(reject);

        });
      }
    });
  });

  this.ready = () => new Promise((resolve, reject) => this.initCollections().then(resolve).catch(reject));

  return this;

})();

const createId = coll => new Promise((resolve, reject) => {

  const getCounter = () => new Promise((resolve, reject) => {
    const task = () => documentdb.readDocument(db[coll].counterLink, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else { reject(r.convert(err)); }
      } else { resolve(res); }
    });
    task();
  });

  const increment = counterDoc => new Promise((resolve, reject) => {
    counterDoc.counter++;
    const task = () => documentdb.upsertDocument(db[coll].link, counterDoc, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else { reject(r.convert(err)); }
      } else { resolve(String(res.counter)); }
    });
    task();
  });

  getCounter().then(increment).then(resolve).catch(reject);

});

exports.create = (coll, input, opts) => new Promise((resolve, reject) => {

  const isArr = input instanceof Array;
  const items = isArr ? input : [input];
  const results = [];
  opts = opts || {};

  items.forEach((item, i, arr) => {

    const task = () => documentdb.createDocument(db[coll].link, item, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else { reject(r.convert(err)); }
      } else {
        results.push(res);
        if (i === arr.length-1) { resolve((isArr ? results : results[0])); }
      }
    });

    if (opts.createId) { createId(coll).then(id => { item.id = id; task(); }).catch(reject); }
    else { task(); }

  });

});

exports.delete = (coll, input) => new Promise((resolve, reject) => {

  const isArr = input instanceof Array;
  const rids = isArr ? input : [input];
  const results = [];

  rids.forEach((rid, i, arr) => {

    const link = db[coll].link + 'docs/' + rid + '/';

    const task = () => documentdb.deleteDocument(link, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else if (+err.code === 404) { reject(r.json(`Item with RID ${rid} not found.`, 404)); }
        else { reject(r.convert(err)); }
      } else {
        results.push(r.json(`RID ${rid} successfully deleted.`, 204));
        if (i === arr.length-1) { resolve((isArr ? results : results[0])); }
      }
    });

    task();

  });

});

exports.get = (coll, input) => new Promise ((resolve, reject) => {

  const isArr = input instanceof Array;
  const rids = isArr ? input : [input];
  const results = [];

  rids.forEach((rid, i, arr) => {

    const link = db[coll].link + 'docs/' + rid + '/';

    const task = () => documentdb.readDocument(link, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else if (+err.code === 404) { reject(r.json(`Item with RID ${rid} not found.`, 404)); }
        else { reject(r.convert(err)); }
      } else {
        results.push(res);
        if (i === arr.length-1) { resolve((isArr ? results : results[0])); }
      }
    });

    task();

  });

});

exports.getById = (coll, input, opts) => new Promise((resolve, reject) => {

  const isArr = input instanceof Array;
  const ids = isArr ? input : [input];
  const idType = opts.idType === 'serviceId' ? 'serviceId' : 'id';
  opts = opts || {};

  const task = () => documentdb.executeStoredProcedure(db[coll].sprocs.getItemsByIds.link, [ids, idType], (err, res, headers) => {
    if (err) {
      if (err.code === +429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
      else { reject(r.convert(err)); }
    } else {
      resolve((isArr ? res : res[0]));
    }
  });

  task();

});

exports.upsert = (coll, input, opts) => new Promise((resolve, reject) => {

  const isArr = input instanceof Array;
  const items = isArr ? input : [input];
  const results = [];
  opts = opts || {};

  items.forEach((item, i, arr) => {

    const upsert = id => new Promise((resolve, reject) => {
      item.id = item.id || id;
      item.permissions = item.permissions || { owner: [], viewer: [], contributor: [], public: false };
      const task = () => documentdb.upsertDocument(db[coll].link, item, (err, res, headers) => {
        if (err) {
          if (err.code === +429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
          else { reject(r.convert(err)); }
        } else {
          results.push(res);
          if (i === arr.length-1) { resolve((isArr ? results : results[0])); }
        }
      });
      task();
    });

    if (opts.createId || !item.id) { createId(coll).then(upsert).then(resolve).catch(reject); }
    else { upsert().then(resolve).catch(reject); }

  });

});

exports.ready = db.ready;
