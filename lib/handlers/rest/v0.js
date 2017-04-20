const db = require(`../../modules/db`);

const ifNoneMatchHeader = `if-none-match`;

const destroy = async (req, res) => {
  await db.delete(req.params[req.type], req.token.sub);
  res.status(204).end();
};

const destroyAll = async (req, res) => {
  await db.deleteAll(req.query.ids, req.token.sub);
  res.status(204).end();
};

const get = async (req, res) => {

  const opts = {};
  const ifNoneMatch = req.headers[ifNoneMatchHeader];

  if (ifNoneMatch) {
    opts.accessCondition = {
      condition: ifNoneMatch,
      type:      `IfNoneMatch`,
    };
  }

  const model = await db.get(req.params[req.type], req.token.sub, req.Type, opts);

  res.status(200).json(model);

};

const getAll = async (req, res) => {

  const opts = {
    continuation: req.headers[`dlx-continuation`],
    maxItemCount: req.headers[`dlx-max-item-count`],
  };

  const models = await db.getAll(req.query.ids, req.token.sub, req.Type, opts);

  if (models.continuation) res.set(`dlx-continuation`, models.continuation);
  Reflect.deleteProperty(models, `continuation`);

  if (req.query.ids && models.length < req.query.ids.length) res.status(207);
  else res.status(200);

  res.json(models);

};

const upsert = async (req, res) => {
  const model = await db.upsert(req.body, req.token.sub, req.Type);
  res.status(201).json(model);
};

const upsertAll = async (req, res) => {
  const multi = Array.isArray(req.body);
  const data = multi ? req.body : [req.body];
  const models = await db.upsertAll(data, req.token.sub, req.Type);
  res.status(201).json(multi ? models : models[0]);
};

// wrap all (async) methods in order to catch any unhandled errors in promises
const wrap = fn => (...args) => fn(...args).catch(args[2]);

const methods = {
  delete: destroy,
  deleteAll: destroyAll,
  destroy,
  destroyAll,
  get,
  getAll,
  upsert,
  upsertAll,
};

Object.entries(methods).forEach(([key, val]) => {
  module.exports[key] = wrap(val);
});
