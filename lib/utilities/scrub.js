const { isContributor } = require('./permissions');

module.exports = (model, userID) => {
  if (model.anonymize && !isContributor(model, userID)) model.anonymize();
  Reflect.deleteProperty(model, `_attachments`);
  Reflect.deleteProperty(model, `_rid`);
  Reflect.deleteProperty(model, `_self`);
  Reflect.deleteProperty(model, `permissions`);
  return model;
};
