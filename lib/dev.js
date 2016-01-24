const qs = require('querystring');

const query = qs.stringify({
  client_id: '98cbdfee-7c01-4d5b-a436-a36df403a8b5',
  redirect_uri: 'http://localhost:3000/developer',
  response_type: 'token',
  state: 12345
});

// query
const authReq = 'http://localhost:3000/auth?client_id=98cbdfee-7c01-4d5b-a436-a36df403a8b5&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdeveloper&response_type=token&state=12345';

const getToken = () => {
  const token = window.location.hash.replace(/^#/, '').split('&').reduce((prev, item, i, arr) => {
    const param = decodeURIComponent(item.split('=')[0]);
    const val = decodeURIComponent(item.split('=')[1]);
    prev[param] = val;
    return prev;
  }, {}).access_token;
};

// token
const token = '78BeJTNl8U6C1mP8prVCV1M2J4PdC9X/+s0Gw3CaVcnbnJIDXP2Nzy7Yxg4ktXy+La8vSh3qkwPl+7cyCnn+Kg==';

const makeReq = () => {
  var headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  headers.append('Authorization', 'Bearer ' + '78BeJTNl8U6C1mP8prVCV1M2J4PdC9X/+s0Gw3CaVcnbnJIDXP2Nzy7Yxg4ktXy+La8vSh3qkwPl+7cyCnn+Kg==');
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
