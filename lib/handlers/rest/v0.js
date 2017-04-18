const db          = require(`../../db`);
const permissions = require('../../permissions');

const { hasEditScope, hasUserScope, isPublic, isViewer } = permissions;

const permissionsError = `The provided access token has insufficient permissions for this operation.`;

const scrub = doc => {
  Reflect.deleteProperty(doc, `_rid`);
  Reflect.deleteProperty(doc, `_self`);
  Reflect.deleteProperty(doc, `_attachments`);
  Reflect.deleteProperty(doc, `permissions`);
  return doc;
};

const getLanguage = async (req, res) => {

  const language = await db.getLanguage(req.params.language);

  if (isPublic(language) || (hasUserScope(req.token.scope) && isViewer(language, req.token.sub))) {
    res.status(200);
    res.json(scrub(language));
  } else {
    res.error(403, `The client or user has insufficient permissions to access the resource with ID "${language.id}".`);
  }

};

const getLanguages = async (req, res) => {

  const languages = await db.getLanguages(req.token.sub, req.query);

  res.status(200);
  res.json(languages.map(scrub));

};

const upsertLanguage = async (req, res) => {

  if (!hasEditScope(req.token.scope)) {
    return res.error(403, permissionsError);
  }

  const language = await db.upsertLanguage(req.body, req.token.sub);

  res.status(201);
  res.json(scrub(language));

};

const upsertLanguages = async (req, res) => {

  if (!hasEditScope(req.token.scope)) {
    return res.error(403, permissionsError);
  }

  const arrayParam = Array.isArray(req.body);
  const data       = arrayParam ? req.body : [req.body];
  const languages  = await Promise
    .all(data.map(lang => db.upsertLanguage(lang, req.token.sub)));

  languages.forEach(scrub);
  res.status(201);
  res.json(arrayParam ? languages : languages[0]);

};

// wrap all (async) methods in order to catch any unhandled errors in promises
const wrap = fn => (...args) => fn(...args).catch(args[2]);

const methods = {
  getLanguage,
  getLanguages,
  upsertLanguage,
  upsertLanguages,
};

Object.entries(methods).forEach(([key, val]) => {
  module.exports[key] = wrap(val);
});
