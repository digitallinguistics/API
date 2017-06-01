const convertError     = require(`../utils/convertError`);
const db               = require(`../db`);
const { hasEditScope } = require(`../utils/permissions`);

const defaultCallback = () => {};

const checkId = id => {
  if (typeof id !== `string`) throw new TypeError(`The "id" argument must be a String.`);
};

const checkScope = scope => {
  if (!hasEditScope(scope)) {
    const err = new Error(`The provided access token has insufficient permissions for this operation.`);
    err.status = 403;
    throw err;
  }
};

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
  const add = async (Type, data, options = {}, callback = defaultCallback) => {
    const token = socket.decoded_token;
    checkScope(token.scope);
    const { cb, opts } = parseArgs(options, callback);
    const model        = await db.create(data, token.sub, Type, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 201,
    });
    socket.broadcast.emit(`add`, model.id);
  };

  const destroy = async (id, options = {}, callback = defaultCallback) => {
    const token = socket.decoded_token;
    checkScope(token.scope);
    checkId(id);
    const { cb, opts } = parseArgs(options, callback);
    await db.delete(id, token.sub, opts);
    cb(undefined, { status: 204 });
    socket.broadcast.emit(`delete`, id);
  };

  const get = async (id, options = {}, callback = defaultCallback) => {
    checkId(id);
    const { cb, opts } = parseArgs(options, callback);
    const model = await db.get(id, socket.decoded_token.sub, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 200,
    });
  };

  const getAll = async (Type, options = {}, callback = defaultCallback) => {

    const { cb, opts } = parseArgs(options, callback);

    if (opts.lastModified) opts.lastModified = new Date(opts.lastModified) / 1000 | 0;

    const models = await db.getAll(socket.decoded_token.sub, Type, opts);
    const info   = { status: 200 };

    if (models.continuation) {
      info.continuation = models.continuation;
      Reflect.deleteProperty(models, `continuation`);
    }

    cb(undefined, models, info);

  };

  const update = async (data, options = {}, callback = defaultCallback) => {
    const token = socket.decoded_token;
    checkScope(token.scope);
    const { cb, opts } = parseArgs(options, callback);
    const model        = await db.update(data, token.sub, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 200,
    });
    socket.broadcast.emit(`update`, model.id);
  };

  const upsert = async (data, options = {}, callback = defaultCallback) => {
    const token = socket.decoded_token;
    checkScope(token.scope);
    const { cb, opts } = parseArgs(options, callback);
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
    console.log(err); // TODO: remove this
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
