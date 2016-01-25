'use strict';

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

  // validates an email and returns true or false
  this.validateEmail = email => {
    var regexp = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$', 'i');
    return regexp.test(email);
  };

}.call(global));
