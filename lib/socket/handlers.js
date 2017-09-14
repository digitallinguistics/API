/* eslint-disable
  no-param-reassign,
*/

const config = require('../config');
const db     = require(`../db`);

const {
  convertError,
  parents,
} = require(`../utilities`);

const defaultCallback = () => {};

const parseArgs = (options, callback) => {

  let cb;
  let opts;

  if (!(options || callback)) {
    cb   = defaultCallback;
    opts = {};
  }

  if (options instanceof Function) {
    cb   = options;
    opts = {};
  } else {
    cb   = callback || defaultCallback;
    opts = options || {};
  }

  if (!(opts instanceof Object)) {
    const err  = new TypeError(`The options argument must be an Object.`);
    err.status = 400;
    throw err;
  }

  if (!(cb instanceof Function)) {
    const err  = new TypeError(`The callback argument must be a Function.`);
    err.status = 400;
    throw err;
  }

  return {
    cb,
    opts,
  };

};

module.exports = socket => {


  // GENERIC CRUD HANDLERS

  // arguments: type, data, options, callback
  const add = async (...args) => {

    const type  = args.find(arg => typeof arg === `string`);
    const data  = args.find(arg => arg instanceof Object && !(arg instanceof Function));
    const cb    = args.find(arg => arg instanceof Function) || defaultCallback;
    const opts  = args.filter(arg => arg instanceof Object && arg !== type && arg !== data && arg !== cb);
    const token = socket.decoded_token;

    // check whether parent resource exists
    if (type in parents) {

      const parentIDKey = `${parents[type].toLowerCase()}ID`;
      const parentID    = opts[parentIDKey] || data[parentIDKey];

      if (!parentID) {
        const e  = new Error(`Please provide a ${parentIDKey}.`);
        e.status = 400;
        throw e;
      }

      const parent      = await db.get(parentID, token.sub);
      data[parentIDKey] = parent.id;

    }

    const model        = await db.create(type, data, token.sub);
    const lastModified = new Date(model._ts).toUTCString();

    cb(undefined, model, {
      lastModified,
      status: 201,
    });

  };

  const destroy = async (type, id, options = {}, callback = defaultCallback) => {
    const { cb, opts } = parseArgs(options, callback);
    const token        = socket.decoded_token;
    const res          = await db.delete(type, id, token.sub, opts);
    cb(undefined, res, { status: 204 });
    socket.broadcast.emit(`delete`, id, res.type);
  };

  const get = async (id, options = {}, callback = defaultCallback) => {
    const { cb, opts } = parseArgs(options, callback);
    const model        = await db.get(id, socket.decoded_token.sub, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 200,
    });
  };

  const getAll = async (type, options = {}, callback = defaultCallback) => {

    const { cb, opts } = parseArgs(options, callback);

    const models = await db.getAll(type, socket.decoded_token.sub, opts);

    const info   = {
      itemCount: models.length,
      status:    200,
    };

    if (models.continuation) {
      info.continuation = models.continuation;
      Reflect.deleteProperty(models, `continuation`);
    }

    cb(undefined, models, info);

  };

  const update = async (type, data, options = {}, callback = defaultCallback) => {

    const { cb, opts } = parseArgs(options, callback);
    const token        = socket.decoded_token;
    data.id            = data.id || options.id;
    data.type          = type;

    // don't allow the parentID properties to be changed
    if (data.type in parents) {
      const parentIDKey = `${parents[data.type].toLowerCase()}ID`;
      delete data[parentIDKey];
    }

    const model        = await db.update(data, token.sub, opts);
    const lastModified = new Date(model._ts).toUTCString();

    cb(undefined, model, {
      lastModified,
      status: 200,
    });

    socket.broadcast.emit(`update`, model.id);

  };

  const upsert = async (data, options = {}, callback = defaultCallback) => {

    const { cb, opts } = parseArgs(options, callback);
    const token        = socket.decoded_token;

    // check whether parent resource exists
    if (data.type in parents) {

      const parentIDKey = `${parents[data.type].toLowerCase()}ID`;
      const parentID    = opts[parentIDKey] || data[parentIDKey];

      if (!parentID) {
        const e  = new Error(`Please provide a ${parentIDKey}.`);
        e.status = 400;
        throw e;
      }

      const parent      = await db.get(parentID, token.sub);
      data[parentIDKey] = parent.id;

    }

    const model        = await db.upsert(data, token.sub, opts);
    const lastModified = new Date(model._ts).toUTCString();

    cb(undefined, model, {
      lastModified,
      status: 201,
    });

    socket.broadcast.emit(`upsert`, model.id);

  };


  // TYPE-SPECIFIC HANDLERS

  const getLexemes = async (languageID, options = {}, callback = defaultCallback) => {

    const { cb, opts } = parseArgs(options, callback);
    opts.parentID      = languageID;
    const lexemes      = await db.getAll(`Lexeme`, socket.decoded_token.sub, opts);

    const info   = {
      itemCount: lexemes.length,
      status:    200,
    };

    if (lexemes.continuation) {
      info.continuation = lexemes.continuation;
      Reflect.deleteProperty(lexemes, `continuation`);
    }

    cb(undefined, lexemes, info);

  };

  const handlers = {

    // generic handlers
    add,
    delete: destroy,
    destroy,
    get,
    getAll,
    update,
    upsert,

    // type-specific handlers
    addLanguage:    (...args) => add(`Language`, ...args),
    deleteLanguage: (...args) => destroy(`Language`, ...args),
    getLanguage:    get,
    getLanguages:   (...args) => getAll(`Language`, ...args),
    updateLanguage: (...args) => update(`Language`, ...args),
    upsertLanguage: upsert,

    addLexeme:      (...args) => add(`Lexeme`, ...args),
    deleteLexeme:   (...args) => destroy(`Lexeme`, ...args),
    getLexeme:      get,
    getLexemes,
    updateLexeme:   (...args) => update(`Lexeme`, ...args),
    upsertLexeme:   upsert,

  };

  // WRAP HANDLERS TO CATCH ERRORS IN PROMISES
  const wrap = handler => (...args) => handler(...args).catch(err => {
    const cb  = args.find(arg => typeof arg === `function`);
    const e   = convertError(err);
    const res = Object.assign({}, e);
    if (config.logErrors && e.status >= 500) console.error(e);
    if (cb) return cb(res);
    socket.emit(`exception`, res);
  });

  Object.entries(handlers).forEach(([key, val]) => {
    handlers[key] = wrap(val);
  });

  return handlers;

};
