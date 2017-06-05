const config  = require('../../config');
const cluster = require('cluster');

module.exports = (req, res, next) => {
  if (config.localhost) {
    if (cluster.isWorker) console.log(`Worker ${cluster.worker.id} received request.`);
    console.log(`\nRequested: ${req.method} ${req.originalUrl}`);
  }
  next();
};
