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
    var pub = false;

    Object.defineProperties(this, {

      /**
       * The unique ID for this application, a hyphen-separated lowercase UUID.
       * @type {string}
       * @memberof ClientApp
       */
      id: {
        get: () => id,
        set: val => {
          if (!hexRegex.test(val)) { throw new Error('Invalid client ID.'); }
          else {
            Object.defineProperty(this, 'id', {
              value: val,
              enumerable: true
            });
            Object.seal(this);
          }
        },
        enumerable: true,
        configurable: true
      },

      _rid: {
        value: data._rid || data.rid || null,
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
       * The non-unique name of the application, provided during app registration.
       * @type {string}
       * @memberof ClientApp
       */
      name: {
        enumerable: true,
        get: () => name,
        set: val => {
          if (typeof val !== 'string') {
            throw new Error('Application name must be a string.');
          } else {
            name = val;
          }
        }
      },

      scopes: {
        value: data.scopes || ['public', 'user'],
        enumerable: true
      },

      /**
       * The redirect URIs that were provided during app registration.
       * @type {array}
       * @memberof ClientApp
       */
      redirects: {
        value: data.redirects || [],
        enumerable: true
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

    if (data.id) { this.id = data.id; }
    this.name = data.name || '';

    Object.defineProperties(this.permissions, {

      owner: {
        value: (data && data.permissions) ? data.permissions.owner : [],
        enumerable: true
      },

      contributor: {
        value: (data && data.permissions) ? data.permissions.contributor : [],
        enumerable: true
      },

      viewer: {
        value: (data && data.permissions) ? data.permissions.viewer : [],
        enumerable: true
      },

      public: {
        get: () => pub,
        set: val => pub = Boolean(val)
      }

    });

  }
};

module.exports = ClientApp;
