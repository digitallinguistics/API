'use strict';

const permissions = {
  owner: [],
  contributor: [],
  viewer: []
};

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

    this.permissions = {
      owner: [],
      contributor: [],
      viewer: []
    };

    if (data) {
      Object.keys(this).forEach(key => this[key] = data[key] || this[key]);
      this.id = validateEmail(data.id || data.email || data.userId) ? (data.id || data.email || data.userId) : this.id;
      this.rid = data.rid || data._rid || this.rid;
      this.link = data.link || data._self || this.link;
    }

  }

  checkToken (token) {
    if (!token) { return 'missing'; }
    else if (new Date() > new Date(this.tokenExpiry)) { return 'expired'; }
    else if (token === this.dlxToken || decryptToken(token) === this.rid) { return 'valid'; }
    else { return 'invalid'; }
  }

  isContributor (id) {
    return this.isOwner(id) || this.permissions.contributor.includes(id);
  }

  isOwner (id) {
    return this.permissions.owner.includes(id);
  }

  isViewer (id) {
    return this.isContributor(id) || this.permissions.viewer.includes(id);
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
