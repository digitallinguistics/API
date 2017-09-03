/**
 * This file adds some utility methods to the DLx library, and exports the library for use by other modules
 * @type {[type]}
 */

const dlx = require('@digitallinguistics/dlx-js');

const {
  Language,
  Lexeme,
} = dlx.models;

const base = `https://api.digitallinguistics.io`;

Language.prototype.setURL = function setURL() {
  this.url = `${base}/languages/${this.id}`;
};

Lexeme.prototype.setURL = function setURL() {
  this.url = `${base}/languages/${this.languageID}/lexemes/${this.id}`;
};

module.exports = dlx;
