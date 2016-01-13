'use strict';

// node modules
var utils = require('./utils');

class User {
  constructor(data) {

    this.userId = ''; // also the user email
    this.dlxToken = '';

    this.affiliation = '';
    this.firstName = '';
    this.lastName = '';

    this.services = {};

    if (data) {
      Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
      this.userId = utils.validateEmail(data.id || data.email || data.userId) ? (data.id || data.email || data.userId) : this.userId;
    }

  }

  get email () {
    return this.userId;
  }

  set email (val) {
    this.id = val;
  }

  get id () {
    return this.userId;
  }

  set id (val) {
    if (!utils.validateEmail(val)) { return new TypeError('Invalid email ID.'); }
    else { this.userId = val; }
  }

}

module.exports = User;
