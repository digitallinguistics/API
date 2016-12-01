const wwwAuthenticate = (headers, message) => {
  headers['www-authenticate'] = `Bearer realm="DLx" error="invalid_token" error_description="${message}"`;
};

module.exports = { wwwAuthenticate };
