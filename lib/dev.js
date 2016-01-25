const qs = require('querystring');

var base = 'https://dlx-dev.azurewebsites.net/auth';

var query = qs.stringify({
  client_id: 'cc679afa-d8e8-4f7b-9bde-a80636cfafbf',
  redirect_uri: 'https://dlx-dev.azurewebsites.net/developer',
  response_type: 'token',
  state: 12345
});

console.log(base + '?' + query);

var authReq = 'http://localhost:3000/auth?client_id=cc679afa-d8e8-4f7b-9bde-a80636cfafbf&redirect_uri=https%3A%2F%2Fdlx-dev.azurewebsites.net%2Fdeveloper&response_type=token&state=12345';

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

  fetch('https://dlx-dev.azurewebsites.net/v1/lexicons?ids=1,4,9', init)
  .then(res => res.json().then(text => console.log(text)).catch(err => console.log(err)))
  .catch(err => console.log(err));

};
