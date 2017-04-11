const createUUID = require('uuid/v4');
const jwt        = require('jsonwebtoken');

const fourHours = 14400;

const convertScope = scope => {
  switch (scope) {
    case 'public': return 1;
    case 'user': return 2;
    case 'admin': return 3;
    default: return 0;
  }
};

const hasScope = (client, scope) => {

  const requestedScope = convertScope(scope);
  const allowedScope   = convertScope(client.scope);

  return allowedScope >= requestedScope;

};

const sign = (payload, secret, options) => new Promise((resolve, reject) => {
  jwt.sign(payload, secret, options, (err, token) => {
    if (err) reject(err);
    else resolve(token);
  });
});

module.exports = (client, scope, user) => new Promise((resolve, reject) => {

  if (!hasScope(client, scope)) {
    const err = new Error('The client does not have sufficient permissions to use this scope.');
    err.name = 'invalid_scope';
    reject(err);
  }

  const payload = {
    cid: client.id,
    scp: scope,
  };

  const opts = {
    audience:  'https://api.digitallinguistics.io/',
    expiresIn: fourHours,
    issuer:    'https://api.digitallinguistics.io/',
    jwtid:     createUUID(),
  };

  if (user) opts.subject = user.id;

  resolve(sign(payload, client.secret, opts));

});
