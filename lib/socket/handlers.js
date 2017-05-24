const convertError = require(`../utils/convertError`);
const db           = require(`../db`);

module.exports = socket => {

  // GENERIC CRUD METHODS
  const add = async (Type, data, callback) => {
    const model        = await db.create(data, socket.decoded_token.sub, Type);
    const lastModified = new Date(model._ts).toUTCString();
    callback(undefined, model, {
      lastModified,
      status: 201,
    });
  };

  const destroy = async (id, options = {}, callback) => {
    const opts = options instanceof Function ? {} : options;
    const cb   = options instanceof Function ? options : callback;
    await db.delete(id, socket.decoded_token.sub, opts);
    cb(undefined, { status: 204 });
  };

  const get = async (Type, id, options = {}, callback) => {
    const opts  = options instanceof Function ? {} : options;
    const cb    = options instanceof Function ? options : callback;
    const model = await db.get(id, socket.decoded_token.sub, Type, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 200,
    });
  };

  const getAll = async (Type, options = {}, callback) => {

    const opts = options instanceof Function ? {} : options;
    const cb   = options instanceof Function ? options : callback;

    if (opts.lastModified) opts.lastModified = new Date(opts.lastModified) / 1000 | 0;

    const models = await db.getAll(socket.decoded_token.sub, Type, opts);
    const info   = { status: 200 };

    if (models.continuation) {
      info.continuation = models.continuation;
      Reflect.deleteProperty(models, `continuation`);
    }

    cb(undefined, models, info);

  };

  const update = async (Type, data, options = {}, callback) => {
    const opts         = options instanceof Function ? {} : options;
    const cb           = options instanceof Function ? options : callback;
    const model        = await db.update(data, socket.decoded_token.sub, Type, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 200,
    });
  };

  const upsert = async (Type, data, options = {}, callback) => {
    const opts         = options instanceof Function ? {} : options;
    const cb           = options instanceof Function ? options : callback;
    const model        = await db.upsert(data, socket.decoded_token.sub, Type, opts);
    const lastModified = new Date(model._ts).toUTCString();
    cb(undefined, model, {
      lastModified,
      status: 201,
    });
  };

  // TYPE-SPECIFIC METHODS

  const handlers = {
    add,
    delete: destroy,
    destroy,
    get,
    getAll,
    update,
    upsert,
  };

  // WRAP HANDLERS TO CATCH ERRORS IN PROMISES
  const wrap = handler => (...args) => handler(...args).catch(err => {
    const cb = args.filter(arg => typeof arg === `function`)[0];
    const e  = convertError(err);
    if (cb) return cb(e);
    socket.emit(`exception`, err);
  });

  Object.entries(handlers).forEach(([key, val]) => {
    handlers[key] = wrap(val);
  });

  return handlers;

};
