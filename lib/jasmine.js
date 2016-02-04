const app = require('../app');
const Jasmine = require('jasmine');

const jasmine = new Jasmine();

jasmine.loadConfigFile('./jasmine.json');

jasmine.onComplete(() => {
  app.end();
});

jasmine.execute();
