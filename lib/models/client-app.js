'use strict';

const crypto = require('crypto');

/**
 * Returns a new instance of a ClientApp
 * @type {function}
 */
const ClientApp = class {
  /**
   * The ClientApp constructor
   * @name ClientApp
   * @param  {object} data        The raw data to create the client app with.
   * @return {object}             Returns a new ClientApp instance.
   */
  constructor(data) {

    const hexRegex = new RegExp(/^[0-9a-f\-]+$/);

    var id;
    var name;

    Object.defineProperties(this, {

      /**
       * The unique ID for this application, a hyphen-separated lowercase UUID.
       * @type {string}
       * @memberof ClientApp
       */
      id: {
        get: () => id,
        set: val => {
          if (!hexRegex.test(data.id)) { throw new Error('Invalid client ID.'); }
          else { id = val; }
        },
        enumerable: true
      },

      /**
       * The app secret, a random 40-character hex string.
       * @type {string}
       * @memberof ClientApp
       */
      secret: {
        value: data.secret || crypto.randomBytes(20).toString('hex'),
        enumerable: true
      },

      /**
       * The non-unique name of the application, provided by its creator.
       * @type {string}
       * @memberof ClientApp
       */
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

      /**
       * The permissions hash for this application.
       * @type {object}
       * @memberof ClientApp
       */
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
