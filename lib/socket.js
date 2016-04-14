const socketjwt = require('socketio-jwt');

const getSecret = (req, token, cb) => {
  // retrieve app from server based on cid in token
  // cb(err, res);
};

module.exports = io => {

  io.on('connection', socketjwt.authorize({
    secret: getSecret,
    handshake: false
  }));

};
