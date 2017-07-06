const config = require(`../../config`);

module.exports = socket => socket.use(([event], next) => {
  console.log(`\nEvent requested: ${event}`);
  return next();
});
