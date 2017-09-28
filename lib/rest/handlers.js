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
const maxItemCountHeader    = `dlx-max-item-count`;

const setLastModifiedHeader = (res, model) => res.set(`Last-Modified`, new Date(model._ts).toUTCString());

const create = async (req, res) => {

  const Type = req.SubType ? req.SubType : req.Type;

  // if item is a subitem, get parentID
  if (Type in parents) {
    const parentIDProp     = `${parents[Type].toLowerCase()}ID`;
    const parentID         = req.params[req.type] || req.query[parentIDProp] || req.body[parentIDProp];
    req.body[parentIDProp] = parentID;
  }

  req.body.type = Type;
  const model = await db.create(Type, req.body, req.token.sub);
  setLastModifiedHeader(res, model);
  res.status(201).json(model);

};

const destroy = async (req, res) => {

  const type = req.subType ? req.subType : req.type;
  const Type = req.SubType ? req.SubType : req.Type;
  const id   = req.params[type];
  const opts = { ifMatch: req.headers[ifMatchHeader] };

  await db.delete(Type, id, req.token.sub, opts);

  res.status(204).end();

  const { io } = req.app;
  io.of(`/`).emit(`delete`, id, Type);
  io.of(`/v0`).emit(`delete`, id, Type);

};

const get = async (req, res) => {

  const type = req.subType ? req.subType : req.type;

  const opts = {
    deleted:     req.query.deleted === `true`,
    ifNoneMatch: req.headers[ifNoneMatchHeader],
  };

  const model = await db.get(req.params[type], req.token.sub, opts);

  setLastModifiedHeader(res, model);
  res.status(200).json(model);

};

const getAll = async (req, res) => {

  // set options
  const opts = {
    continuation:    req.headers[continuationHeader],
    deleted:         req.query.deleted === `true`,
    ifModifiedSince: req.headers[ifModifiedSinceHeader],
    maxItemCount:    req.headers[maxItemCountHeader],
    public:          req.query.public === `true`,
  };

  // set Type
  const Type = req.SubType ? req.SubType : req.Type;

  // set parentID if item is a subitem, and parentID is present in path or querystring
  if (Type in parents) {
    const parentIDProp = `${parents[Type].toLowerCase()}ID`;
    opts.parentID      = req.params[req.type] || req.query[parentIDProp];
  }

  // get results
  const models = await db.getAll(Type, req.token.sub, opts);

  // set headers and send response
  if (models.continuation) {
    res.set(continuationHeader, models.continuation);
    delete models.continuation;
  }
  res.set(itemCountHeader, models.length);
  res.status(200).json(models);

};

const update = async (req, res) => {

  const opts = { ifMatch: req.headers[ifMatchHeader] };
  const type = req.subType ? req.subType : req.type;
  const Type = req.SubType ? req.SubType : req.Type;

  req.body.id   = req.params[type];
  req.body.type = Type;

  // don't allow the parentID properties to be changed
  if (Type in parents) {
    const parentIDProp = `${parents[Type].toLowerCase()}ID`;
    delete req.body[parentIDProp];
  }

  const model = await db.update(req.body, req.token.sub, opts);
  setLastModifiedHeader(res, model);
  res.status(200).json(model);
  const { io } = req.app;
  io.of(`/`).emit(`update`, req.body.id, Type);
  io.of(`/v0`).emit(`update`, req.body.id, Type);

};

const upsert = async (req, res) => {

  const Type    = req.SubType ? req.SubType : req.Type;
  req.body.type = Type;

  // set parent ID on body
  if (Type in parents) {

    const parentIDProp = `${parents[Type].toLowerCase()}ID`;

    const parentID = req.params[parents[Type].toLowerCase()]
      || req.query[parentIDProp]
      || req.body[parentIDProp];

    req.body[parentIDProp] = parentID;

  }

  const opts    = { ifMatch: req.headers[ifMatchHeader] };
  const model   = await db.upsert(req.body, req.token.sub, opts);
  setLastModifiedHeader(res, model);
  res.status(201).json(model);
  const { io } = req.app;
  io.of(`/`).emit(`upsert`, req.body.id, Type);
  io.of(`/v0`).emit(`upsert`, req.body.id, Type);

};

// wrap all async methods in order to catch any unhandled errors in promises
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
