/* eslint-disable
  func-style,
  require-jsdoc,
*/

function addPermissions(resource) {
  resource.permissions = resource.permissions || {};
  const p          = resource.permissions;
  p.contributors   = p.contributors || [];
  p.owners         = p.owners || [];
  p.viewers        = p.viewers || [];
  p.public         = p.public || false;
  return resource;
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
