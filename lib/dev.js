const qs = require('querystring');

var query = qs.stringify({
  client_id: '98cbdfee-7c01-4d5b-a436-a36df403a8b5',
  redirect_uri: 'http://localhost:3000/developer',
  response_type: 'token',
  state: 12345
});

// query
var authReq = 'http://localhost:3000/auth?client_id=98cbdfee-7c01-4d5b-a436-a36df403a8b5&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdeveloper&response_type=token&state=12345';

const getToken = () => {
  var token = window.location.hash.replace(/^#/, '').split('&').reduce((prev, item, i, arr) => {
    const param = decodeURIComponent(item.split('=')[0]);
    const val = decodeURIComponent(item.split('=')[1]);
    prev[param] = val;
    return prev;
  }, {}).access_token;
  console.log(token);
};

const makeReq = () => {
  var headers = new Headers();
  const token = '78BeJTNl8U6C1mP8prVCV2wMkIFmJREMnSj4jI4mOvZAQbBervaKjV+uYH01DG3XGmDnn3YU/ToNsOnAYmrKNg==';
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  headers.append('Authorization', 'Bearer ' + token);
  var body = {
    "hello": "world",
    "type": "lexicon",
    "lexEntries": [
      {
        "type": "lexEntry",
        "lemma": "hola",
        "gloss": "hello"
      },
      {
        "type": "lexEntry",
        "lemma": "mundo",
        "gloss": "world"
      }
    ]
  };
  fetch('http://localhost:3000/v1/lexicons', {
    headers: headers,
    credentials: 'include',
    method: 'PUT',
    body: JSON.stringify(body) })
  .then(res => {
    res.json().then(res => console.log(res)).catch(err => console.log(err));
  })
  .catch(err => console.log(err));
};

const deleteStuff = () => {
  var headers = new Headers();
  var token = '78BeJTNl8U6C1mP8prVCV3A58Pv2q9Dw/Y5ci7O2NtWmJY5szD7FfguzjVuYnNg1FeiAfkPbpTd6jviP1uhc3w==';
  headers.append('Authorization', 'Bearer ' + token);
  fetch('http://localhost:3000/v1/lexicons/148ec29c-e5b9-2d43-3987-35288aa66ddc', {
    credentials: 'include',
    headers: headers,
    method: 'DELETE'
  }).then(res => {
    if (res.status !== 204) {
      res.json().then(res => console.log(res)).catch(err => console.log(err));
    } else {
      console.log(res.status);
    }
  }).catch(err => console.log(err));
};

const getStuff = () => {
  var headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Authorization', 'Bearer ' + token);
  fetch('http://localhost:3000/v1/lexicons/3a6b1c2c-f8c3-7343-5611-e4e670635d5f', { headers: headers })
  .then(res => {
    res.json().then(res => console.log(res)).catch(err => console.log(err));
  })
  .catch(err => console.log(err));
};

const deleteMoreStuff = () => {

  var headers = new Headers();
  headers.append('Authorization', 'Bearer ' + token);

  var init = {
    headers: headers,
    method: 'DELETE'
  };

  fetch('https://dlx-dev.azurewebsites.net/v1/lexicons?ids=1', init)
  .then(res => res.json().then(text => console.log(text)).catch(err => console.log(err)))
  .catch(err => console.log(err));

};


var base = 'https://dlx-dev.azurewebsites.net/auth';

var query = qs.stringify({
  client_id: 'cc679afa-d8e8-4f7b-9bde-a80636cfafbf',
  redirect_uri: 'http://dlx-dev.azurewebsites.net/developer',
  response_type: 'token',
  state: 12345
});

var authReq = 'https://dlx-dev.azurewebsites.net/auth?client_id=cc679afa-d8e8-4f7b-9bde-a80636cfafbf&redirect_uri=http%3A%2F%2Fdlx-dev.azurewebsites.net%2Fdeveloper&response_type=token&state=12345';
