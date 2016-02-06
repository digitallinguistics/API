'use strict';
const credentials = require('../credentials');
const jwt = require('jsonwebtoken');

const permissions = {
  public: false,
  owner: [],
  contributor: [],
  viewer: []
};

// Validates an email and returns true or false.
const validateEmail = email => {
  var regexp = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$', 'i');
  return regexp.test(email);
};

class User {
  constructor(data) {

    this.id = ''; // also the user email
    this.rid = '';
    this.link = '';
    this.dlxToken = '';
    this.lastActive = Date.now();

    this.affiliation = '';
    this.firstName = '';
    this.lastName = '';

    this.apps = [];

    this.services = {};

    this.permissions = permissions;

    if (data) {
      Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
      this.id = validateEmail(data.id || data.email || data.userId) ? (data.id || data.email || data.userId) : this.id;
      this.rid = data._rid || data.rid || this.rid;
      this.link = data.link || data._self || this.link;
      Object.keys(permissions).forEach(key => this.permissions[key] = this.permissions[key] || []);
    }

  }

  isContributor (id) {
    return this.isOwner(id) || this.permissions.contributor.includes(id);
  }

  isOwner (id) {
    return this.permissions.owner.includes(id);
  }

  isViewer (id) {
    return this.permissions.public || this.isContributor(id) || this.permissions.viewer.includes(id);
  }

  makeContributor (obj) {
    obj.permissions = obj.permissions || permissions;
    obj.permissions.contributor = [...obj.permissions.contributor, this.id].unique();
    this.permissions.contributor.push(obj.id);
  }

  makeOwner (obj) {
    obj.permissions = obj.permissions || permissions;
    obj.permissions.owner = [...obj.permissions.owner, this.id].unique();
    this.permissions.owner.push(obj.id);
  }

  makeViewer (obj) {
    obj.permissions = obj.permissions || permissions;
    obj.permissions.viewer = [...obj.permissions.viewer, this.id].unique();
    this.permissions.viewer.push(obj.id);
  }

  removeContributor (obj) {
    obj.permissions.contributor.splice(obj.permissions.indexOf(this.id));
    this.permissions.contributor.splice(this.permissions.indexOf(obj.id));
  }

  removeOwner (obj) {
    obj.permissions.owner.splice(obj.permissions.indexOf(this.id));
    this.permissions.owner.splice(this.permissions.indexOf(obj.id));
  }

  removeViewer (obj) {
    obj.permissions.viewer.splice(obj.permissions.indexOf(this.id));
    this.permissions.viewer.splice(this.permissions.indexOf(obj.id));
  }

  updateToken () {
    const payload = { rid: this.rid };
    this.dlxToken = jwt.sign(payload, credentials.secret, { expiresIn: 3600 });
    this.lastActive = Date.now();
    return this.dlxToken;
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
