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

var token = 'UGpjowN67VlsLgm7dcSBIHOFfB/MrFzrlJVn2UO/qqndbNOf+FwZ4bgUByGVZWQwSQ6tH2Ez9lSvaF+DNRKAqA==';

const doStuff = () => {

  var headers = new Headers();
  headers.append('Authorization', 'Bearer ' + token);

  var lexicon = {
    lexEntries: [1, 17, 12, 42, 18],
    permissions: {
      owner: [],
      contributor: [],
      viewer: [],
      public: false
    },
    hello: 'world'
  };

  fetch('https://dlx-api.azurewebsites.net/v1/lexicons/100')
  .then(res => res.text().then(text => console.log(text)).catch(err => console.log(err)))
  .catch(err => console.log(err));

};
