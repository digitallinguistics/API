/* eslint-disable
  no-param-reassign,
*/

const db = require(`../db`);

const continuationHeader = `dlx-continuation`;
const ifMatchHeader      = `if-match`;
const ifNoneMatchHeader  = `if-none-match`;
const lastModifiedHeader = `if-modified-since`;
const maxItemsHeader     = `dlx-max-item-count`;

const setLastModified = (res, model) => res.set(`Last-Modified`, new Date(model._ts).toUTCString());

const create = async (req, res) => {
  req.body.type = req.Type;
  const model = await db.create(req.body, req.token.sub, req.Type);
  setLastModified(res, model);
  res.status(201).json(model);
  const { io } = req.app;
  io.of(`/`).emit(`add`, model.id);
  io.of(`/v0`).emit(`add`, model.id);
};

const destroy = async (req, res) => {
  const id   = req.params[req.type];
  const opts = { ifMatch: req.headers[ifMatchHeader] };
  await db.delete(id, req.token.sub, opts);
  res.status(204).end();
  const { io } = req.app;
  io.of(`/`).emit(`delete`, id);
  io.of(`/v0`).emit(`delete`, id);
};

const get = async (req, res) => {
  const opts = { ifNoneMatch: req.headers[ifNoneMatchHeader] };
  const model = await db.get(req.params[req.type], req.token.sub, opts);
  setLastModified(res, model);
  res.status(200).json(model);
};

const getAll = async (req, res) => {

  const opts = {
    continuation: req.headers[continuationHeader],
    lastModified: req.headers[lastModifiedHeader],
    maxItemCount: req.headers[maxItemsHeader],
    public:       req.query.public === `true`,
  };

  if (opts.lastModified) opts.lastModified = new Date(opts.lastModified) / 1000 | 0;
  const models = await db.getAll(req.token.sub, req.Type, opts);
  if (models.continuation) res.set(`dlx-continuation`, models.continuation);
  Reflect.deleteProperty(models, `continuation`);
  res.status(200).json(models);

};

const update = async (req, res) => {
  const opts = { ifMatch: req.headers[ifMatchHeader] };
  req.body.id = req.params[req.type];
  req.body.type = req.Type;
  const model = await db.update(req.body, req.token.sub, opts);
  setLastModified(res, model);
  res.status(200).json(model);
  const { io } = req.app;
  io.of(`/`).emit(`update`, req.body.id);
  io.of(`/v0`).emit(`update`, req.body.id);
};

const upsert = async (req, res) => {
  req.body.type = req.Type;
  const opts = { ifMatch: req.headers[ifMatchHeader] };
  const model = await db.upsert(req.body, req.token.sub, opts);
  setLastModified(res, model);
  res.status(201).json(model);
  const { io } = req.app;
  io.of(`/`).emit(`upsert`, req.body.id);
  io.of(`/v0`).emit(`upsert`, req.body.id);
};

// wrap all (async) methods in order to catch any unhandled errors in promises
const wrap = fn => (...args) => fn(...args).catch(args[2]);

const methods = {
  create,
  delete: destroy,
  destroy,
  get,
  getAll,
  update,
  upsert,
};

Object.entries(methods).forEach(([key, val]) => {
  module.exports[key] = wrap(val);
});
