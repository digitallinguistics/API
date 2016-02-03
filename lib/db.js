const credentials = require('./credentials');
const DocumentDB = require('documentdb');

const documentdb = new DocumentDB.DocumentClient(credentials.documentdb.host, { masterKey: credentials.documentdb.key });

/**
 * The db object initializes the DocumentDB database and saves information about the database and its collections
 */
const db = (() => {

  /**
   * The unique resource ID (RID) for the database
   * @type {string}
   */
  this.rid = global.env === 'production' ? credentials.documentdb.rid : credentials.documentdb.devRid;

  /**
   * The self link for the database
   * @type {string}
   */
  this.link = (() => 'dbs/' + this.rid + '/')();

  /**
   * A hash containing any stored procedures to be upserted to the database upon initialization.
   * @type {object}
   * @prop {object} getItemsByIds           Retrieves items from a collection by ID.
   */
  this.sprocs = {
    getItemsByIds: require('./sprocs/getItemsByIds')
  };

  /**
   * Initializes the database
   */
  this.initCollections = () => new Promise((resolve, reject) => {
    documentdb.readCollections(this.link).toArray((err, collections) => {
      if (err) { reject(convertResponse(err)); }
      else {

        var collectionsUploaded = 0;

        collections.forEach(coll => {

          this[coll.id] = {
            link: coll._self,
            rid: coll._rid,
            sprocs: {}
          };

          const checkCounter = () => new Promise((resolve, reject) => {

            const readCounter = () => new Promise((resolve, reject) => {
              documentdb.executeStoredProcedure(this[coll.id].sprocs.getItemsByIds.link, [['counter'], 'id'], (err, res) => {
                if (err) { reject(convertResponse(err)); } else { resolve(res); }
              });
            });

            const uploadCounter = res => new Promise((resolve, reject) => {
              if (res.length === 0) {
                const counterDoc = { id: 'counter', counter: 0, services: {}, permissions: {} };
                documentdb.createDocument(this[coll.id].link, counterDoc, (err, res) => {
                  if (err) { reject(convertResponse(err)); }
                  else { this[coll.id].counterLink = res._self; resolve(res); }
                });
              } else { this[coll.id].counterLink = res[0]._self; resolve(); }
            });

            readCounter().then(uploadCounter).then(resolve).catch(reject);

          });

          const uploadSprocs = () => new Promise((resolve, reject) => Object.keys(this.sprocs).forEach(sprocName => {
            var sprocsUploaded = 0;
            documentdb.upsertStoredProcedure(this[coll.id].link, this.sprocs[sprocName], (err, res) => {
              if (err) { reject(convertResponse(err)); }
              else {
                this[coll.id].sprocs[sprocName] = { link: res._self, rid: res._rid };
                sprocsUploaded++;
                if (Object.keys(this.sprocs).length === sprocsUploaded) { resolve(); }
              }
            });
          }));

          uploadSprocs().then(checkCounter).then(() => {
            collectionsUploaded++;
            if (collectionsUploaded === collections.length) { resolve(); }
          }).catch(reject);

        });
      }
    });
  });

  /**
   * Calls the initialization function and returns a Promise that resolves when the database is ready. This method should be called before any further calls to the database are made.
   * @return {[type]} [description]
   */
  this.ready = () => new Promise((resolve, reject) => this.initCollections().then(resolve).catch(reject));

  return this;

})();

/**
 * A convenience function that autoincrements the ID for a collection and returns the new ID
 * @param {string} collection     The collection to get the autoincremented ID of.
 * @returns                       Returns the new autoincremented ID.
 */
const createId = coll => new Promise((resolve, reject) => {

  const getCounter = () => new Promise((resolve, reject) => {
    const task = () => documentdb.readDocument(db[coll].counterLink, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else { reject(convertResponse(err)); }
      } else { resolve(res); }
    });
    task();
  });

  const increment = counterDoc => new Promise((resolve, reject) => {
    counterDoc.counter++;
    const task = () => documentdb.upsertDocument(db[coll].link, counterDoc, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else { reject(convertResponse(err)); }
      } else { resolve(String(res.counter)); }
    });
    task();
  });

  getCounter().then(increment).then(resolve).catch(reject);

});

/**
 * Creates a database object
 * @param   {string} collection              The collection to add the object to.
 * @param   {(object|array)} items           A single object or array of objects to add to the collection.
 * @param   {object} [opts]                  An optional options hash.
 * @prop    {string} [opts.createId]         If true, autoincrements the ID for the new object. If false, DocumentDB automatically assigns a random GUID.
 * @returns {(object|array)}                 Returns the new database object(s) as either an object or an array.
 */
exports.create = (coll, input, opts) => new Promise((resolve, reject) => {

  opts = opts || {};
  const isArr = input instanceof Array;
  const items = isArr ? input : [input];
  const results = [];

  items.forEach(item => {
    if (coll === 'users') { item.services = item.services || {}; }
    const task = () => documentdb.createDocument(db[coll].link, item, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else { reject(convertResponse(err)); }
      } else {
        results.push(res);
        if (results.length === items.length) {
          resolve(isArr ? results : results[0]);
        }
      }
    });

    if (opts.createId) { createId(coll).then(id => { item.id = id; task(); }).catch(reject); }
    else { task(); }

  });

});

/**
 * Deletes one or more resources from the database.
 * @param   {string} collection      The collection to delete the resource(s) from.
 * @param   {(string|array)} rids    An RID or array of RIDs for the resources to delete.
 * @returns {(object|array)}         If the delete operation is successful, returns an object with a <code>status</code> property equal to <code>204</code> for each item deleted. If the delete operation fails for any operation (say, because of an incorrect ID), a single error object with a <code>status: 4xx || 5xx</code> attribute is returned.
 */
exports.delete = (coll, input) => new Promise((resolve, reject) => {

  const isArr = input instanceof Array;
  const rids = isArr ? input : [input];
  const results = [];

  rids.forEach(rid => {

    const link = db[coll].link + 'docs/' + rid + '/';

    const task = () => documentdb.deleteDocument(link, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else if (+err.code === 404) { reject(jsonResponse(`Item with RID ${rid} not found.`, 404)); }
        else { reject(convertResponse(err)); }
      } else {
        results.push(jsonResponse(`RID ${rid} successfully deleted.`, 204));
        if (rids.length === results.length) { resolve((isArr ? results : results[0])); }
      }
    });

    task();

  });

});

/**
 * Retrieves one or more resources from the database by their RIDs.
 * @param   {string} collection      The collection to retrieve the items from.
 * @param   {(object|array)} rids    An RID or an array of RIDs for the resources to retrieve.
 * @returns {(object|array)}         Returns the requested object or an array of the requested objects.
 */
exports.get = (coll, input) => new Promise ((resolve, reject) => {

  const isArr = input instanceof Array;
  const rids = isArr ? input : [input];
  const results = [];

  rids.forEach(rid => {

    const link = db[coll].link + 'docs/' + rid + '/';

    const task = () => documentdb.readDocument(link, (err, res, headers) => {
      if (err) {
        if (+err.code === 429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
        else if (+err.code === 404) { reject(jsonResponse(`Item with RID ${rid} not found.`, 404)); }
        else { reject(convertResponse(err)); }
      } else {
        results.push(res);
        if (rids.length === results.length) { resolve((isArr ? results : results[0])); }
      }
    });

    task();

  });

});

/**
 * Retrieves items from the database by ID, service ID, or email ID
 * @param   {string} collection                      The collection to retrieve the resources from.
 * @param   {(string|array)} ids                     An ID or array of IDs for the resources to retrieve.
 * @param   {object} [opts]                          An optional options hash.
 * @prop    {string} [opts.idType|opts.id_type]      <code>id</code> (including email), or <code>serviceId</code> (also accepts <code>service_id</code>)
 * @prop    {string} [opts.service]                  The 3rd-party service to match for service ID. Currently required if <code>idType</code> is set to <code>serviceId</code>.
 * @return  {(object|array)}                         The object or array of objects retrieved from the database.
 */
exports.getById = (coll, input, opts) => new Promise((resolve, reject) => {

  opts = opts || {};
  opts.idType = opts.idType || opts.id_type;
  const isArr = input instanceof Array;
  const ids = isArr ? input : [input];

  opts.idType = (opts.idType === 'serviceId' || opts.idType === 'service_id') ? 'serviceId' : 'id';

  const task = () => documentdb.executeStoredProcedure(db[coll].sprocs.getItemsByIds.link, [ids, opts.idType, { service: opts.service }], (err, res, headers) => {
    if (err) {
      if (err.code === +429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
      else { reject(convertResponse(err)); }
    } else {
      resolve(isArr ? res : res[0]);
    }
  });

  task();

});

/**
 * Exports the database initialization function.
 */
exports.ready = db.ready;

/**
 * Strips a DocumentDB object of its metadata fields so as not to expose them to the end user client.
 * @param {object} dbObj            A DocumentDB document object.
 * @returns {object}                Returns the DocumentDB object without its metadata properties.
 */
exports.strip = dbObj => {
  delete dbObj._rid;
  delete dbObj._attachments;
  delete dbObj._etag;
  delete dbObj._self;
  delete dbObj._ts;
  return dbObj;
};

/**
 * Upserts one or more resources to the database.
 * @param   {string} collection            The collection to upsert items to.
 * @param   {(object|array)} items         The item or items to upsert to the database.
 * @param   {object} [opts]                An optional options hash.
 * @prop    {string} [opts.createId]       If true, autoincrements the ID for the upserted items. ()<strong>Warning:</strong> this will overwrite any existing ID on the object, thus creating a duplicate object.) If false, DocumentDB automatically assigns the resource a GUID if it does not have an ID already.
 * @returns {(object|array)}               Returns the upserted object or array of objects.
 */
exports.upsert = (coll, input, opts) => new Promise((resolve, reject) => {

  opts = opts || {};
  const isArr = input instanceof Array;
  const items = isArr ? input : [input];
  const results = [];

  items.forEach(item => {

    item = JSON.parse(JSON.stringify(item));

    const upsert = id => new Promise((resolve, reject) => {
      if (id) { item = this.strip(item); item.id = id; }
      item.permissions = item.permissions || { owner: [], viewer: [], contributor: [], public: false };
      if (coll === 'users') { item.services = item.services || {}; }
      const task = () => documentdb.upsertDocument(db[coll].link, item, (err, res, headers) => {
        if (err) {
          if (err.code === +429) { setTimeout(task, (+headers['x-ms-retry-after-ms']) + 1); }
          else { reject(convertResponse(err)); }
        } else {
          results.push(res);
          if (items.length === results.length) { resolve((isArr ? results : results[0])); }
        }
      });
      task();
    });

    if (opts.createId) { createId(coll).then(upsert).then(resolve).catch(reject); }
    else { upsert().then(resolve).catch(reject); }

  });

});
