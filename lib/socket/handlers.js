const convertError = require(`../utils/convertError`);

const methods = {};

module.exports = socket => {

  // WRAP METHODS TO CATCH ERRORS IN PROMISES
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
