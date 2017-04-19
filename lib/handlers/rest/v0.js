const db = require(`../../modules/db`);

const deleteLanguage = async (req, res) => {
  await db.delete(req.params.language, req.token.sub);
  res.status(204).end();
};

const deleteLanguages = async (req, res) => {
  await db.deleteAll(req.query.ids, req.token.sub);
  res.status(204).end();
};

const getLanguage = async (req, res) => {
  const language = await db.get(req.params.language, req.token.sub, `Language`);
  res.status(200).json(language);
};

const getLanguages = async (req, res) => {
  const languages = await db.getAll(req.query, req.token.sub, `Language`);
  if (req.query.ids && languages.length < req.query.ids.length) res.status(207);
  else res.status(200);
  res.json(languages);
};

const upsertLanguage = async (req, res) => {
  const language = await db.upsert(req.body, req.token.sub, `Language`);
  res.status(201).json(language);
};

const upsertLanguages = async (req, res) => {
  const multi = Array.isArray(req.body);
  const data = multi ? req.body : [req.body];
  const languages = await db.upsertAll(data, req.token.sub, `Language`);
  res.status(201).json(multi ? languages : languages[0]);
};

// wrap all (async) methods in order to catch any unhandled errors in promises
const wrap = fn => (...args) => fn(...args).catch(args[2]);

const methods = {
  deleteLanguage,
  deleteLanguages,
  getLanguage,
  getLanguages,
  upsertLanguage,
  upsertLanguages,
};

Object.entries(methods).forEach(([key, val]) => {
  module.exports[key] = wrap(val);
});
