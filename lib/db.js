const dlx           = require('./dlx');
const { promisify } = require('util');

const {
  bulkDelete,
  coll,
  client,
  createDocument,
  deleteDocument,
  readDocument,
  updateDocument,
  upsertDocument,
} = require('./documentdb');

const {
  hydrate,
  makeRequest,
  parents,
  permissions,
  plurals,
  scrub,
  subItems,
} = require('./utilities');

const {
  addPermissions,
  isContributor,
} = permissions;

const create = async (type, data = {}, userID) => {

  const Model = dlx.models[type];
  const model = addPermissions(hydrate(data, Model));
  model.permissions.owners.push(userID);
  delete model.id; // don't let users set their own ID

  // if item is a subitem
  if (type in parents) {

    // get parentID
    const parentIDProp = `${parents[type].toLowerCase()}ID`;
    const parentID     = data[parentIDProp];

    // validate parentID
    if (typeof parentID !== `string` || !parentID.length) {
      const e = new Error(`The ${parentIDProp} property must be provided either as a query string or in the body of the request.`);
      e.status = 400;
      throw e;
    }

    // check whether parent resource exists, and user can access it
    const parent = await makeRequest(readDocument, parentID, userID);

    // check whether user has permissions to add items to this resource
    if (!isContributor(parent, userID)) {
      const e = new Error(`The user does not have permissions to add ${plurals[parents[type]]} to this ${parents[type]}.`);
      e.status = 403;
      throw e;
    }

    // make owners of parent owners of subitem
    model.permissions.owners.push(...parent.permissions.owners);

  }

  // create the new resource and return it
  const doc = await makeRequest(createDocument, model);
  return scrub(hydrate(doc), userID);

};

const deleteSubItems = async (subType, parentID, userID) => {

  const parentIDProp = `${parents[subType].toLowerCase()}ID`;

  // retrieve all subitems of the given type for the specified parent
  const query = `
    SELECT c.id from items c
    WHERE
      c.type = "${subType}"
      AND c.${parentIDProp} = "${parentID}"
  `;

  const iterator = client.queryDocuments(coll, query);
  const toArray  = promisify(iterator.toArray).bind(iterator);
  const items    = await toArray();

  // bulk delete subitems
  await makeRequest(bulkDelete, items.map(lex => lex.id), userID);

};

const destroy = async (type, id, userID, options = {}) => {

  if (!(typeof id === `string` && id.length)) {
    const e = new Error(`The ID argument must be provided as a non-empty String.`);
    e.status = 400;
    throw e;
  }

  const { ifMatch } = options;

  if (typeof ifMatch !== `undefined` && (typeof ifMatch !== `string` || !ifMatch.length)) {
    const e = new Error(`The If-Match header must be a non-empty String.`);
    e.status = 400;
    throw e;
  }

  // if item is a parent, delete subitems
  if (type in subItems) {
    await Promise.all(subItems[type].map(subType => deleteSubItems(subType, id, userID)));
  }

  const res = await makeRequest(deleteDocument, id, userID, options);
  return res;

};

const get = async (id, userID, options = {}) => {

  const { ifNoneMatch } = options;

  if (!(typeof id === `string` && id.length)) {
    const e = new Error(`The ID argument must be provided as a non-empty String.`);
    e.status = 400;
    throw e;
  }

  if (typeof ifNoneMatch !== `undefined` && (typeof ifNoneMatch !== `string` || !ifNoneMatch.length)) {
    const e = new Error(`The If-Match header must be a non-empty String.`);
    e.status = 400;
    throw e;
  }

  const doc = await makeRequest(readDocument, id, userID, options);
  return scrub(hydrate(doc), userID);

};

const getAll = async (type, userID, options) => {

  if (options.maxItemCount && typeof options.maxItemCount === `string`) {
    options.maxItemCount = Number(options.maxItemCount);
  }

  const {
    continuation,
    ifModifiedSince,
    maxItemCount,
    parentID,
    public: pub,
  } = options;

  if (typeof continuation !== `undefined` && (typeof continuation !== `string` || !continuation.length)) {
    const e = new Error(`The dlx-continuation header must be a non-empty String.`);
    e.status = 400;
    throw e;
  }

  if (typeof ifModifiedSince !== `undefined` && isNaN(Date.parse(ifModifiedSince))) {
    const e = new Error(`The If-Modified-Since header must be a valid date string.`);
    e.status = 400;
    throw e;
  }

  if (typeof maxItemCount !== `undefined` && !Number.isInteger(maxItemCount)) {
    const e = new Error(`The dlx-max-item-count header must be an Integer.`);
    e.status = 400;
    throw e;
  }

  if (typeof parentID !== `undefined` && (typeof parentID !== `string` || !parentID.length)) {
    const parentIDProp = `${parents[type].toLowerCase()}ID`;
    const e = new Error(`The ${parentIDProp} property must be a non-empty String.`);
    e.status = 400;
    throw e;
  }

  if (typeof pub !== `undefined` && !(pub === true || pub === false)) {
    const e = new Error(`The public option must be a Boolean.`);
    e.status = 400;
    throw e;
  }

  const publicQuery = `
    c.permissions.public = true
    OR
  `;

  const permissionsQuery = `
    -- User has view permissions
    AND (
      ${pub ? publicQuery : ''}
      ARRAY_CONTAINS(c.permissions.viewers, "${userID}")      -- User is viewer
      OR
      ARRAY_CONTAINS(c.permissions.contributors, "${userID}") -- User is contributor
      OR
      ARRAY_CONTAINS(c.permissions.owners, "${userID}")       -- User is owner
    )
  `;

  const lastModifiedQuery = `
    -- Has been modified after the value of If-Modified-Since
    AND c._ts >= ${Math.floor(new Date(ifModifiedSince || null) / 1000)}
  `;

  const subItemQuery = `
    -- Has the specified parent item
    AND c.${parents[type] ? parents[type].toLowerCase() : ''}ID = "${parentID}"
  `;

  const query = `
    SELECT * FROM items c
    WHERE
      -- Has correct type
      c.type = "${type}"

      -- TTL is not set
      AND (NOT IS_DEFINED(c.ttl))

      ${parentID ? subItemQuery : ''}
      ${userID ? permissionsQuery : 'AND c.public = true'}
      ${ifModifiedSince ? lastModifiedQuery : ''}
  `;

  const queryIterator = client.queryDocuments(coll, query, options);

  const executeNext = () => new Promise((resolve, reject) => {
    queryIterator.executeNext((err, res, headers) => {
      if (err) reject(err);
      else resolve({ headers, res });
    });
  });

  const toArray = () => new Promise((resolve, reject) => {
    queryIterator.toArray((err, res) => {
      if (err) reject(err);
      else resolve({ res });
    });
  });

  let docs = [];

  if (options.maxItemCount) docs = await makeRequest(executeNext);
  else docs = await makeRequest(toArray);

  const response = docs.map(doc => scrub(hydrate(doc), userID));
  if (docs.continuation) response.continuation = docs.continuation;
  return response;

};

const update = async (data = {}, userID, options = {}) => {

  if (!(typeof data.id === `string` && data.id.length)) {
    const e = new Error(`The ID property must be provided either as an argument or as a property of the request body, as a non-empty String.`);
    e.status = 400;
    throw e;
  }

  const { ifMatch } = options;

  if (typeof ifMatch !== `undefined` && (typeof ifMatch !== `string` || !ifMatch.length)) {
    const e = new Error(`The If-Match header must be a non-empty String.`);
    e.status = 400;
    throw e;
  }

  hydrate(data); // do not pass model to update - it will overwrite properties that it shouldn't
  const doc = await makeRequest(updateDocument, data, userID, options);
  return scrub(hydrate(doc), userID);

};

const upsert = async (data = {}, userID, options = {}) => {

  if (!data.id) return create(data.type, data, userID);

  const { ifMatch } = options;

  if (typeof ifMatch !== `undefined` && (typeof ifMatch !== `string` || !ifMatch.length)) {
    const e = new Error(`The If-Match header must be a non-empty String.`);
    e.status = 400;
    throw e;
  }

  const model = addPermissions(hydrate(data));

  // if item is a subitem
  if (model.type in parents) {

    // get parentID
    const parentIDProp = `${parents[model.type].toLowerCase()}ID`;
    const parentID     = model[parentIDProp];

    // validate parentID
    if (typeof parentID !== `string` || !parentID.length) {
      const e = new Error(`The ${parentIDProp} property must be provided either as a query string or in the body of the request.`);
      e.status = 400;
      throw e;
    }

    // check whether parent resource exists, and user can access it
    const parent = await makeRequest(readDocument, parentID, userID);

    // check whether user has permissions to upsert items to this parent
    if (!isContributor(parent, userID)) {
      const e = new Error(`The user does not have permissions to add ${plurals[parents[model.type]]} to this ${parents[model.type]}.`);
      e.status = 403;
      throw e;
    }

    // make owners of parent owners of subitem
    model.permissions.owners.push(...parent.permissions.owners);

  }

  const doc   = await makeRequest(upsertDocument, model, userID, options);
  return scrub(hydrate(doc), userID);

};

module.exports = {
  client,
  coll,
  create,
  delete:  destroy,
  destroy,
  get,
  getAll,
  update,
  upsert,
};
