/* eslint-disable
  no-param-reassign,
*/

const db          = require(`../db`);
const { parents } = require('../utilities');

const continuationHeader    = `dlx-continuation`;
const ifMatchHeader         = `if-match`;
const ifNoneMatchHeader     = `if-none-match`;
const ifModifiedSinceHeader = `if-modified-since`;
const itemCountHeader       = `dlx-item-count`;
const maxItemsHeader        = `dlx-max-item-count`;

const setLastModified = (res, model) => res.set(`Last-Modified`, new Date(model._ts).toUTCString());

const create = async (req, res) => {

  // check whether parent resource exists
  if (req.SubType) {
    const parent = await db.get(req.params[req.type], req.token.sub);
    req.body[`${req.type}ID`] = parent.id;
  }

  const type = req.SubType ? req.SubType : req.Type;

  req.body.type = type;
  const model = await db.create(req.body, req.token.sub, type);
  setLastModified(res, model);
  res.status(201).json(model);

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
  const opts  = { ifNoneMatch: req.headers[ifNoneMatchHeader] };
  const model = await db.get(req.params[req.type], req.token.sub, opts);
  setLastModified(res, model);
  res.status(200).json(model);
};

const getAll = async (req, res) => {

  const opts = {
    continuation:    req.headers[continuationHeader],
    ifModifiedSince: req.headers[ifModifiedSinceHeader],
    maxItemCount:    req.headers[maxItemsHeader],
    parentID:        req.params[req.type],
    public:          req.query.public === `true`,
  };

  const type = req.SubType ? req.SubType : req.Type;

  const models = await db.getAll(req.token.sub, type, opts);
  if (models.continuation) res.set(continuationHeader, models.continuation);
  Reflect.deleteProperty(models, `continuation`);
  res.set(itemCountHeader, models.length);
  res.status(200).json(models);

};

const update = async (req, res) => {

  const opts    = { ifMatch: req.headers[ifMatchHeader] };
  req.body.id   = req.params[req.type];
  req.body.type = req.Type;

  // don't allow the parentID properties to be changed
  if (req.Type in parents) Reflect.deleteProperty(req.body, `${parents[req.Type]}ID`);

  const model = await db.update(req.body, req.token.sub, opts);
  setLastModified(res, model);
  res.status(200).json(model);
  const { io } = req.app;
  io.of(`/`).emit(`update`, req.body.id);
  io.of(`/v0`).emit(`update`, req.body.id);

};

const upsert = async (req, res) => {

  // check whether parent resource exists
  if (req.SubType) {
    const parent = await db.get(req.params[req.type], req.token.sub);
    req.body[`${req.type}ID`] = parent.id;
  }

  req.body.type = req.SubType ? req.SubType : req.Type;
  const opts    = { ifMatch: req.headers[ifMatchHeader] };
  const model   = await db.upsert(req.body, req.token.sub, opts);
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
