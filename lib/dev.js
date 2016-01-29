const qs = require('querystring');

const query = {
  client_id: '4c002d65-ffe3-4750-9968-33258eac0ed5',
  redirect_uri: 'http://localhost:3000/',
  response_type: 'token',
  state: '12345'
};

const params = qs.stringify(query);

console.log('http://localhost:3000/auth?' + params);


function doStuff () {
  var authUrl = 'http://localhost:3000/auth?client_id=4c002d65-ffe3-4750-9968-33258eac0ed5&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&response_type=token&state=12345';

  fetch(authUrl)
  .then(res => res.json().then(data => console.log(data)))
  .catch(err => console.log(err));
}
