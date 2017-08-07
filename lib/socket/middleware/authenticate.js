module.exports = socket => socket.use(([event], next) => {

  if (event !== `authenticate` && !socket.decoded_token) {

    const err = new Error(`Client must be authenticated in order to use the Socket API.`);

    err.data = {
      error:             `Unauthorized`,
      error_description: err.message,
      status:            401,
    };

    // next() must be called with an Error object here
    // in order to return the correct response to the client
    return next(err);

  }

  return next();

});
