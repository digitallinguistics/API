const qs = require('querystring');

// query
var authReq = 'http://localhost:3000/auth?client_id=98cbdfee-7c01-4d5b-a436-a36df403a8b5&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdeveloper&response_type=token&state=12345';

const getToken = () => {
  var token = window.location.hash.replace(/^#/, '').split('&').reduce((prev, item, i, arr) => {
    const param = decodeURIComponent(item.split('=')[0]);
    const val = decodeURIComponent(item.split('=')[1]);
    prev[param] = val;
    return prev;
  }, {}).access_token;
};

const doStuff = () => {

  var headers = new Headers();
  headers.append('Authorization', 'Bearer ' + token);

  var init = {
    headers: headers,
    method: 'DELETE'
  };

  fetch('http://localhost:3000/v1/lexicons?ids=1,4,9', init)
  .then(res => res.json().then(text => console.log(text)).catch(err => console.log(err)))
  .catch(err => console.log(err));

};


var base = 'http://localhost:3000/auth';

var query = qs.stringify({
  client_id: 'cc679afa-d8e8-4f7b-9bde-a80636cfafbf',
  redirect_uri: 'http://localhost:3000/developer',
  response_type: 'token',
  state: 12345
});

var authReq = 'http://localhost:3000/auth?client_id=cc679afa-d8e8-4f7b-9bde-a80636cfafbf&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdeveloper&response_type=token&state=12345';
