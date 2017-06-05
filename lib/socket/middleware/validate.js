const { hasEditScope } = require(`../../utils/permissions`);

const requireEditScope = [
  `add`,
  `delete`,
  `update`,
  `upsert`,
];

module.exports = (socket, handlers) => socket.use((packet, next) => {

  const [event] = packet;
  const cb = packet.filter(arg => typeof arg === `function`)[0] || next;

  // checks whether event name exists
  if (!(event in handlers)) {
    const err  = new Error(`No "${event}" event exists.`);
    err.status = 404;
    return cb(err);
  }

  // checks whether token has required scope
  if (
    requireEditScope.some(op => event.startsWith(op))
    && !hasEditScope(socket.decoded_token.scope)
  ) {
    const err = new Error(`The provided access token has insufficient permissions for this operation.`);
    err.status = 403;
    return cb(err);
  }

  // checks for ID argument on `destroy` and `get` events
  if (
    [`destroy`, `get`].includes(event)
    && typeof packet[1] !== `string`
  ) {
    const err = new TypeError(`The "id" argument must be a string.`);
    err.status = 400;
    return cb(err);
  }

  return next();

});
