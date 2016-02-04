'use strict';

const credentials = require('./credentials');
const crypto = require('crypto');
const uuid = require('uuid');
require('./responses');

(function () {

  /**
   * Polyfill for Array.prototype.includes().
   */
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

  /**
   * Adds a .unique() method to the Array object.
   */
  if (!Array.prototype.unique) {
    Array.prototype.unique = function () {
      const o = {};
      this.forEach(item => o[item] = item);
      return [...Object.keys(o)];
    };
  }

  /**
   * Decrypts a string.
   */
  this.decrypt = function (string) {
    const decipher = crypto.createDecipher('aes192', credentials.secret);
    var salted = decipher.update(decodeURIComponent(string), 'base64', 'utf8');
    salted += decipher.final('utf8');
    return salted.split(':')[0];
  };

  /**
   * Encrypts a string.
   */
  this.encrypt = function (string) {
    const cipher = crypto.createCipher('aes192', credentials.secret);
    var plain = cipher.update(string + ':' + uuid.v4(), 'utf8', 'base64');
    plain += cipher.final('base64');
    return plain;
  };

  // Validates an email and returns true or false.
  this.validateEmail = email => {
    var regexp = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$', 'i');
    return regexp.test(email);
  };

}.call(global));
