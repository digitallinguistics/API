const config = require(`../../config`);

module.exports = socket => socket.use(([event], next) => {
  if (config.localhost) console.log(`\nEvent requested: ${event}`);
  return next();
});
