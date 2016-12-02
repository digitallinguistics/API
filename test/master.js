const errors = require('./errors');

// run error tests on each API version
errors();
errors('/v0');
