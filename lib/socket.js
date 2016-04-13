module.exports = (io, socket) => {

  console.log('Connected!');

  socket.emit('message', { hello: 'world' });

};
