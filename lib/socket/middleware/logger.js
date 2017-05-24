const config = require(`../../config`);

module.exports = socket => socket.use((packet, next) => {

  if (config.env.development) {
    const [event] = packet;
    console.log(`\nEvent requested: ${event}`);
  }

  return next();

});
