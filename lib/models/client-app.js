'use strict';

const crypto = require('crypto');

const ClientApp = class {
  constructor(data) {

    const hexRegex = new RegExp(/^[0-9a-f\-]+$/);

    var id;
    var name;

    Object.defineProperties(this, {

      id: {
        get: () => id,
        set: val => {
          if (!hexRegex.test(data.id)) { throw new Error('Invalid client ID.'); }
          else { id = val; }
        },
        enumerable: true
      },

      secret: {
        value: data.secret || crypto.randomBytes(20).toString('hex'),
        enumerable: true
      },

      name: {
        enumerable: true,
        writable: true,
        get: () => name,
        set: val => {
          if (typeof name !== 'string') {
            throw new Error('Application name must be a string.');
          } else {
            name = val;
          }
        }
      },

      permissions: {
        value: data.permissions || {},
        enumerable: true
      }

    });

    if (data.id) {
      this.id = data.id;
      Object.defineProperty(this, 'id', {
        value: this.id,
        enumerable: true
      });
    }

    this.name = data.name || '';

    var pub = false;

    Object.defineProperties(this.permissions, {

      owner: {
        value: data.permissions.owner || [],
        enumerable: true
      },

      contributor: {
        value: data.permissions.contributor || [],
        enumerable: true
      },

      viewer: {
        value: data.permissions.viewer || [],
        enumerable: true
      },

      public: {
        get: () => pub,
        set: val => pub = Boolean(val)
      }

    });

    Object.seal(this);

  }
};

module.exports = ClientApp;
