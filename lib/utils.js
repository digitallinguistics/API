'use strict';
// node modules
var config = require('./config');
var credentials = require('./credentials');
var crypto = require('crypto');
var uuid = require('uuid');

// a generic error class
(function () {

  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(arguments[1]) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {k = 0;}
      }
      var currentElement;
      while (k < len) {
        currentElement = O[k];
        if (searchElement === currentElement ||
           (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
          return true;
        }
        k++;
      }
      return false;
    };
  }

  if (!Array.prototype.unique) {
    Array.prototype.unique = function () {
      const o = {};
      this.forEach(item => o[item] = item);
      return [...Object.keys(o)];
    };
  }

  this.decryptToken = token => {
    const decipher = crypto.createDecipher('aes192', credentials.secret);
    var salted = decipher.update(decodeURIComponent(token), 'base64', 'utf8');
    salted += decipher.final('utf8');
    return salted.split(':')[0];
  };

  this.encryptToken = rid => {
    const cipher = crypto.createCipher('aes192', credentials.secret);
    var token = cipher.update(rid + ':' + uuid.v4(), 'utf8', 'base64');
    token += cipher.final('base64');
    return token;
  };

  this.JSONError = class JSONError {
    constructor (err) {
      var details = err.details || (typeof err === 'string' ? err : JSON.stringify(err));
      var error = err.error || err.message;
      var status = err.status ? err.status : (err.code || 500);

      if (!error) {
        switch (status) {
          case 200 || '200': error = 'Operation successful.'; break;
          case 201 || '201': error = 'Upsert successful.'; break;
          case 204 || '204': error = 'Delete operation successful.'; break;
          case 207 || '207': error = 'Some resources unauthorized or not found.'; break;
          case 400 || '400': error = 'Bad request. The request URL, headers, or body are invalid.'; break;
          case 401 || '401': error = '<code>Authorization</code> header missing or invalid.'; break;
          case 403 || '403': error = 'Authorization token expired.'; break;
          case 404 || '404': error = 'Not found.'; break;
          case 405 || '405': error = 'Method not allowed.'; break;
          case 500 || '500': error = `Internal server error. <a class=link href=${config.package.bugs.url}>Open an issue on GitHub.</a>`; break;
          default: error = `Internal server error. <a class=link href=${config.package.bugs.url}>Open an issue on GitHub.</a>`;
        }
      }

      if (!details) { details = '(No additional details provided for this error.)'; }

      this.status = status;
      this.error = error;
      this.details = details;

    }
  };

  this.renderError = (err, res) => {
    res.render('error', new this.JSONError(err));
  };

  // validates an email and returns true or false
  this.validateEmail = email => {
    var regexp = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$', 'i');
    return regexp.test(email);
  };

}.call(global));
