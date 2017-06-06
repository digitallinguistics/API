const convertError = require(`../utils/convertError`);
const db           = require(`../db`);

const defaultCallback = () => {};

const parseArgs = (options, callback) => {

  let cb;
  let opts;

  if (!(options || callback)) {
    cb = defaultCallback;
    opts = {};
  }

  if (options instanceof Function) {
    cb = options;
    opts = {};
  } else {
    cb = callback || defaultCallback;
    opts = options || {};
  }

  if (!(opts instanceof Object)) {
    const err = new TypeError(`The "options" argument must be an Object.`);
    err.status = 400;
    throw err;
  }

  if (!(cb instanceof Function)) {
    const err = new TypeError(`The "callback" argument must be a Function.`);
    err.status = 400;
    throw err;
  }

  return {
    cb,
    opts,
  };

};

module.exports = socket => {

  // GENERIC CRUD METHODS
  const add = async (type, data = {}, options = {}, callback = defaultCallback) => {
    console.log(type);
    console.log(data);
    console.log(options);
    console.log(callback);
    const { cb, opts } = parseArgs(options, callback);
    const token        = socket.decoded_token;
    console.log(token);
    const model        = await db.create(data, token.sub, type, opts);
    console.log(model);
    const lastModified = new Date(model._ts).toUTCString();
    console.log(lastModified);
    cb(undefined, model, {
      lastModified,
      status: 201,
    });
    socket.broadcast.emit(`add`, model.id);
  };

  const destroy = async (id, options = {}, callback = defaultCallback) => {
    const { cb, opts } = parseArgs(options, callback);
    const token        = socket.decoded_token;
    const res = await db.delete(id, token.sub, opts);
    cb(undefined, res);
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

    const models = await db.getAll(socket.decoded_token.sub, type, opts);
    const info   = { status: 200 };

    if (models.continuation) {
      info.continuation = models.continuation;
      Reflect.deleteProperty(models, `continuation`);
    }

    cb(undefined, models, info);

  };

  const update = async (data, options = {}, callback = defaultCallback) => {
    const { cb, opts } = parseArgs(options, callback);
    const token        = socket.decoded_token;
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
    const model        = await db.upsert(data, token.sub, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 201,
    });
    socket.broadcast.emit(`upsert`, model.id);
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
    addLanguage: (...args) => add(`Language`, ...args),
    deleteLanguage: destroy,
    getLanguage: (...args) => get(...args),
    getLanguages: (...args) => getAll(`Language`, ...args),
    updateLanguage: (...args) => update(...args),
    upsertLanguage: (...args) => upsert(...args),

  };

  // WRAP HANDLERS TO CATCH ERRORS IN PROMISES
  const wrap = handler => (...args) => handler(...args).catch(err => {
    const cb = args.filter(arg => typeof arg === `function`)[0];
    const e  = convertError(err);
    if (cb) return cb(e);
    socket.emit(`exception`, e);
  });

  Object.entries(handlers).forEach(([key, val]) => {
    handlers[key] = wrap(val);
  });

  return handlers;

};
