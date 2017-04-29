// UTILITIES
const convertError = err => {

  const status            = Number(err.status || err.code) || 500;
  const error             = err.error || statuses[status];
  const error_description = err.error_description || err.message || statuses[status];

  const e = new Error(status < 500 ? error_description : statuses[status]);

  e.error = error;
  e.error_description = e.message;
  e.status = status;

  return e;

};


// HANDLERS
const get = async (id, options = {}, callback) => {

  const cb   = typeof options === `function` ? options : callback;
  const opts = typeof options === `function` ? {} : options;

  // get the model from the database
  // callback with three arguments: err, model, info
  // - info: includes a `lastModified` property, which is new Date(model._ts).toUTCString()

};

const test = async (data, cb) => cb(null, data);


// WRAP METHODS TO CATCH ERRORS IN PROMISES
const methods = {
  get,
  test,
};

module.exports = socket => {

  const wrap = method => (...args) => method(...args).catch(err => {

    const cb = args.filter(arg => typeof arg === `function`)[0];
    const e  = convertError(err);

    if (cb) return cb(e);
    socket.emit(`exception`, err);

  });

  Object.entries(methods).forEach(([key, val]) => {
    methods[key] = wrap(val);
  });

  return methods;

};
