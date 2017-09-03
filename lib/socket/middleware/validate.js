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

  // checks for ID argument on `delete` and `get` events
  if (
    [`delete`, `destroy`, `get`].includes(event)
    && typeof packet[1] !== `string`
  ) {
    return cb({
      error:             `Bad Request`,
      error_description: `The id argument must be a String.`,
      status:            400,
    });
  }

  // checks for `id` and `type` properties for `update`
  if (event.includes(`update`)) {
    const [, data] = packet;
    if (!(typeof data.id === `string` && data.type)) {
      return cb({
        error:             `Bad Request`,
        error_description: `The id and type properties are required for partial update operations.`,
        status:            400,
      });
    }
  }

  // checks for `id` or `type` properties for `upsert`
  if (event.includes(`upsert`)) {
    const [, data] = packet;
    if (!(typeof data.id === `string` || data.type)) {
      return cb({
        error:             `Bad Request`,
        error_description: `Either the id or type property must be provided for upsert operations.`,
        status:            400,
      });
    }
  }

  return next();

});
