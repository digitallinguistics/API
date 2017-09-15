const { hasEditScope } = require(`../../utilities/permissions`);

const requireEditScope = [
  `add`,
  `delete`,
  `destroy`,
  `update`,
  `upsert`,
];

module.exports = (socket, handlers) => socket.use((packet, next) => {

  const [event] = packet;
  const cb      = packet.filter(arg => typeof arg === `function`)[0] || next;

  // returns `authenticated` if client tries to authenticate again
  if (event === `authenticate` && socket.decoded_token) {
    socket.emit(`authenticated`);
    return cb({
      message: `Authenticated`,
      status:  200,
    });
  }

  // checks whether event name exists
  if (!(event in handlers)) {
    return cb({
      error:             `Not Found`,
      error_description: `No ${event} event exists.`,
      status:            404,
    });
  }

  // checks whether token has required scope
  if (
    requireEditScope.some(op => event.startsWith(op))
    && !hasEditScope(socket.decoded_token.scope)
  ) {
    return cb({
      error:             `Forbidden`,
      error_description: `The provided access token has insufficient permissions for this operation.`,
      status:            403,
    });
  }

  return next();

});
