module.exports = {

  id: 'getItemsByIds',
  serverScript: function (ids, getBy, options) {

    options = options || {};

    if (!Array.prototype.includes) {
      Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
        'use strict'; var O = Object(this); var len = parseInt(O.length) || 0;
        if (len === 0) { return false; }
        var n = parseInt(arguments[1]) || 0; var k;
        if (n >= 0) { k = n; } else { k = len + n; if (k < 0) {k = 0;} }
        var currentElement;
        while (k < len) {
          currentElement = O[k];
          if (searchElement === currentElement || (searchElement !== searchElement && currentElement !== currentElement)) { /* NaN !== NaN */ return true; }
          k++;
        } return false;
      };
    }

    var filter,
      response = __.response,
      results = [];

    var processResults = function (err, res, opts) {
      if (err) { throw new Error(err); }
      else {
        results = results.concat(res);
        if (opts.continuation) {
          var queryResponse = __.filter(filter, { continuation: opts.continuation }, processResults);
          if (!queryResponse.isAccepted) { throw new Error('Timeout getting items.'); }
        } else { response.setBody(results); }
      }
    };

    switch (getBy) {
      case 'serviceId':
        filter = function (user) { return ids.includes(user.services[options.service]); };
        break;
      default:
        filter = function (doc) { return ids.includes(doc.id); };
    }

    var accepted = __.filter(filter, processResults);
    if (!accepted) { throw new Error('Timeout getting items.'); }
  }
};
