const qs = require('querystring');

var base = 'https://dlx-api.azurewebsites.net/auth';

var query = qs.stringify({
  client_id: '80a16b12-a42a-4a73-9bff-b903af76b8f8',
  redirect_uri: 'http://localhost:3000/',
  response_type: 'token',
  state: 12345
});

// console.log(base + '?' + query);

var authReq = 'https://dlx-api.azurewebsites.net/auth?client_id=80a16b12-a42a-4a73-9bff-b903af76b8f8&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&response_type=token&state=12345';

const getToken = () => {
  var token = window.location.hash.replace(/^#/, '').split('&').reduce((prev, item, i, arr) => {
    const param = decodeURIComponent(item.split('=')[0]);
    const val = decodeURIComponent(item.split('=')[1]);
    prev[param] = val;
    return prev;
  }, {}).access_token;
};

var token = 'UGpjowN67VlsLgm7dcSBIO0xg29rmQq20R0nd1dqMALZtiKXhqsp9+q1VcYdT48Cy0d0wlEkQTBOdjWroxNVMA==';

const doStuff = () => {

  var headers = new Headers();
  headers.append('Authorization', 'Bearer ' + token);

  var lexEntry = {
    token: 'ayôún',
    gloss: 'hello'
  };

  var init = {
    body: JSON.stringify(lexEntry),
    headers: headers,
    method: 'PUT'
  };

  fetch('http://localhost:3000/v1/lexicons', init)
  .then(res => res.json().then(data => console.log(data)).catch(err => console.log(err)))
  .catch(err => console.log(err));

};
