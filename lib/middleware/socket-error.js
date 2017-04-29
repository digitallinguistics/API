module.exports = socket => socket.use((packet, next) => {

  const [event] = packet;

  if (event !== `authenticate` && !socket.decoded_token) {

    const err = new Error(`Client must be authenticated in order to use the Socket API.`);

    err.data = {
      error:             `Unauthorized`,
      error_description: err.message,
      status:            401,
    };

    return next(err);

  }

  return next();

});
