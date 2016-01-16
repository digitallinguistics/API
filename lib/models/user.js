'use strict';

// node modules
var utils = require('../utils');

class User {
  constructor(data) {

    if (!data) { throw new Error('Please pass a data argument to the User constructor.'); }

    this.id = ''; // also the user email
    this.rid = '';
    this.dlxToken = '';

    this.affiliation = '';
    this.firstName = '';
    this.lastName = '';

    this.apps = [];

    this.services = {};

    if (data) {
      Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
      this.id = utils.validateEmail(data.id || data.email || data.userId) ? (data.id || data.email || data.userId) : this.id;
      this.rid = data.rid || data._rid || this.rid;
    }

  }

  get email () {
    return this.id;
  }

  set email (val) {
    if (!utils.validateEmail(val)) { return new TypeError('Invalid email ID.'); }
    else { this.id = val; }
  }

}

module.exports = User;
