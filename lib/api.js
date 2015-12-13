var api = exports;

exports.auth = function () {
};

exports.error404 = function (req, res) {
  res.format({
    'application/json': function () {
      res.status(404);
      res.json({
        code: 404,
        message: 'Not found. The request format may be invalid. The request headers or authorization may not be properly set, or the request URL may not be formatted incorrectly. The URL you requested was: ' + req.protocol + req.host + req.originalUrl
      });
    },

    'text/html': function () {
      res.render('404');
    }
  });
};

exports.error500 = function (err, req, res, next) {
  res.format({
    'application/json': function () {
      res.status(500);
      res.json({
        code: 500,
        message: 'Internal server error.'
      });
    },

    'text/html': function () {
      res.render('500');
    }
  });

  next();
};

exports.oauth = function () {
};
