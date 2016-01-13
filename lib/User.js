'use strict';

// node modules
var utils = require('./utils');

class User {
  constructor(data) {

    this.userID = ''; // also the user email
    this.password = '';
    this.dlxToken = '';

    this.affiliation = '';
    this.firstName = '';
    this.lastName = '';

    this.services = {};

    if (data) {
      Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
      this.userID = utils.validateEmail(data.id || data.email) ? (data.id || data.email) : '';
    }

  }

  get email () {
    return this.userID;
  }

  set email (val) {
    this.id = val;
  }

  get id () {
    return this.userID;
  }

  set id (val) {
    if (!utils.validateEmail(val)) { return new TypeError('Invalid email ID.'); }
    else { this.userID = val; }
  }

}

module.exports = User;
