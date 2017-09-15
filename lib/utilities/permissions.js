/* eslint-disable
  func-style,
  require-jsdoc,
*/

function addPermissions(item) {
  item.permissions = item.permissions instanceof Object ? item.permissions : {};
  const p          = item.permissions;
  p.contributors   = Array.isArray(p.contributors) ? p.contributors : [];
  p.owners         = Array.isArray(p.owners) ? p.owners : [];
  p.viewers        = Array.isArray(p.viewers) ? p.viewers : [];
  p.public         = `public` in p ? p.public : false;
  return item;
}

function convertScope(scope = []) {
  return Array.isArray(scope) ? scope :
  scope.split(` `)
    .map(scp => scp.trim())
    .filter(scp => scp);
}

function getPermissions(resource) {
  return addPermissions(resource).permissions;
}

function hasUserScope(scope) {
  return scope.includes(`admin`) || scope.includes(`user`);
}

function isContributor(resource, userID) {
  return isOwner(resource, userID) || getPermissions(resource).contributors.includes(userID);
}

function isOwner(resource, userID) {
  return getPermissions(resource).owners.includes(userID);
}

function isPublic(resource) {
  return getPermissions(resource).public;
}

function isViewer(resource, userID) {
  return isContributor(resource, userID) || getPermissions(resource).viewers.includes(userID);
}

module.exports = {
  addPermissions,
  convertScope,
  getPermissions,
  hasEditScope: hasUserScope,
  hasUserScope,
  isContributor,
  isOwner,
  isPublic,
  isViewer,
};
