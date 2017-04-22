/* eslint-disable
  func-style,
  require-jsdoc,
*/

function convertScope(scope = []) {
  return Array.isArray(scope) ? scope :
  scope.split(` `)
    .map(scp => scp.trim())
    .filter(scp => scp);
}

function getPermissions(resource) {

  const permissions = resource.permissions || {
    contributor: [],
    owner:       [],
    public:      false,
    viewer:      [],
  };

  permissions.contributor = permissions.contributor || [];
  permissions.owner       = permissions.owner || [];
  permissions.viewer      = permissions.viewer || [];
  permissions.public      = permissions.public || false;

  return permissions;

}

function hasUserScope(scope) {
  return scope.includes(`admin`) || scope.includes(`user`);
}

function isContributor(resource, userId) {
  const permissions = getPermissions(resource);
  return isOwner(resource, userId) || permissions.contributor.includes(userId);
}

function isOwner(resource, userId) {
  const permissions = getPermissions(resource);
  return permissions.owner.includes(userId);
}

function isPublic(resource) {
  const permissions = getPermissions(resource);
  return permissions.public;
}

function isViewer(resource, userId) {
  const permissions = getPermissions(resource);
  return permissions.public || isContributor(resource, userId) || permissions.viewer.includes(userId);
}

module.exports = {
  convertScope,
  getPermissions,
  hasEditScope: hasUserScope,
  hasUserScope,
  isContributor,
  isOwner,
  isPublic,
  isViewer,
};
