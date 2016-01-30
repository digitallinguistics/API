var credentials = require('./credentials');
var http = require('http');

exports.getUserByServiceId = serviceId => new Promise((resolve, reject) => {

  const opts = {
    auth: 'dlx-org:' + credentials.secret,
    hostname: 'localhost',
    method: 'PUT',
    path: '/v1/users?serviceId=' + encodeURIComponent(serviceId),
    port: 3000
  };

  http.get(opts, res => {
    var data = '';
    res.on('data', chunk => data += chunk);
    res.on('error', reject);
    res.on('end', () => resolve(data));
  });

});

// exports.getUserByServiceId('9a85adb8e51c57735faa40daecbfea1b')
// .then(res => console.log(res))
// .catch(err => console.error(err));
