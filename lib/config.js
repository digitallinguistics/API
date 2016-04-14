// set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'localhost';
process.env.PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'localhost') {
  require('../../credentials/dlx-api');
}
