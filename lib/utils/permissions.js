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

function isContributor(resource, userId) {
  return isOwner(resource, userId) || getPermissions(resource).contributors.includes(userId);
}

function isOwner(resource, userId) {
  return getPermissions(resource).owners.includes(userId);
}

function isPublic(resource) {
  return getPermissions(resource).public;
}

function isViewer(resource, userId) {
  return isContributor(resource, userId) || getPermissions(resource).viewers.includes(userId);
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
