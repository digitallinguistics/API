const app = require('../app');
const Jasmine = require('jasmine');

const jasmine = new Jasmine(); // jshint ignore:line

jasmine.loadConfigFile('./jasmine.json');

jasmine.onComplete(() => {
  app.end();
});

require('events').EventEmitter.prototype._maxListeners = 100;

app.start().then(() => jasmine.execute());
