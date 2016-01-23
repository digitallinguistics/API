'use strict';

class User {
  constructor(data) {

    this.id = ''; // also the user email
    this.rid = '';
    this.link = '';
    this.dlxToken = '';
    this.tokenExpiry = '';

    this.affiliation = '';
    this.firstName = '';
    this.lastName = '';

    this.apps = [];

    this.services = {};

    if (data) {
      Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
      this.id = validateEmail(data.id || data.email || data.userId) ? (data.id || data.email || data.userId) : this.id;
      this.rid = data.rid || data._rid || this.rid;
      this.link = data.link || this.link;
    }

  }

  checkToken (dlxToken) {
    return dlxToken === this.dlxToken || decryptToken(dlxToken) === this.rid;
  }

  updateToken () {
    this.dlxToken = encryptToken(this.rid);

    const d = new Date();
    this.tokenExpiry = new Date(d.getTime() + 3600000);
  }

  get email () {
    return this.id;
  }

  set email (val) {
    if (!validateEmail(val)) { return new TypeError('Invalid email ID.'); }
    else { this.id = val; }
  }

}

module.exports = User;
