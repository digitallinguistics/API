const convertError = require(`../../utils/convertError`);

module.exports = handlers => (packet, next) => {

  const [event] = packet;
  const cb = packet.filter(arg => typeof arg === `function`)[0];

  if (!(event in handlers)) {
    const err  = new Error(`No "${event}" event exists.`);
    err.status = 404;
    const e = convertError(err);
    return cb ? cb(e) : next(e);
  }

  return next();

};
