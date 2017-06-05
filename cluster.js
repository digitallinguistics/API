const cluster     = require('cluster');
const os          = require('os');
const startServer = require('./app');

const startWorker = () => {
  const worker = cluster.fork();
  console.log(`Worker ${worker.id} started.`);
};

if (cluster.isMaster) {
  os.cpus().forEach(startWorker);
  cluster.on(`disconnect`, worker => console.log(`Worker ${worker.id} disconnected from cluster.`));
  cluster.on(`exit`, (worker, code, signal) => console.log(`Worker ${worker.id} died with exit code ${code} (${signal}).`));
  startWorker();
} else {
  startServer();
}
