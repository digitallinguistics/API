/**
 * This middleware should be passed to individual routes, to check those routes for edit scope
 */

const { permissions } = require('../../utilities');

module.exports = (req, res, next) => {

  if (!permissions.hasEditScope(req.token.scope)) {
    return res.error(403, `The provided access token has insufficient permissions for this operation.`);
  }

  return next();

};
