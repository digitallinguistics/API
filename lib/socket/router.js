const authenticate = require(`./middleware/authenticate`);
const authorize    = require(`./middleware/authorize`);
const validate     = require(`./middleware/validate`);
const handle       = require(`./handlers`);
const logger       = require(`./middleware/logger`);

module.exports = io => {

  io.on(`authenticated`, socket => console.log(`\nClient ${socket.client.id} authenticated.`));
  io.on(`connect`, authenticate);
  io.on(`connect`, authorize);
  io.on(`connect`, logger);

  io.on(`authenticated`, socket => {

    const handlers = handle(socket);
    validate(socket, handlers); // validates requests

    // generic methods
    socket.on(`add`, handlers.add);
    socket.on(`delete`, handlers.delete);
    socket.on(`get`, handlers.get);
    socket.on(`getAll`, handlers.getAll);
    socket.on(`update`, handlers.update);
    socket.on(`upsert`, handlers.upsert);

    // type-specific methods
    socket.on(`addLanguage`, handlers.addLanguage);
    socket.on(`deleteLanguage`, handlers.deleteLanguage);
    socket.on(`getLanguage`, handlers.getLanguage);
    socket.on(`getLanguages`, handlers.getLanguages);
    socket.on(`updateLanguage`, handlers.updateLanguage);
    socket.on(`upsertLanguage`, handlers.upsertLanguage);

  });

  return io;

};
