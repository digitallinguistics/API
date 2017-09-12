const dlx           = require('./dlx');
const { promisify } = require('util');

const {
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
  scrub,
} = require('./utilities');

const { addPermissions } = permissions;

const create = async (type, data = {}, userID) => {
  const Model = dlx.models[type];
  const model = addPermissions(hydrate(data, Model));
  model.permissions.owners.push(userID);
  delete model.id; // don't let users set their own ID
  const doc = await makeRequest(createDocument, model);
  return scrub(hydrate(doc), userID);
};

const destroy = (id, userID, options = {}) => makeRequest(deleteDocument, id, userID, options);

const get = async (id, userID, options = {}) => {
  const doc = await makeRequest(readDocument, id, userID, options);
  return scrub(hydrate(doc), userID);
};

const getAll = async (userID, type, options) => {

  const {
    continuation,
    ifModifiedSince,
    maxItemCount,
    parentID,
    public: pub,
  } = options;

  if (continuation && typeof continuation !== `string`) {
    const e = new Error(`The dlx-continuation header must be a String.`);
    e.status = 400;
    throw e;
  }

  if (ifModifiedSince && !Date.parse(ifModifiedSince)) {
    const e = new Error(`The If-Modified-Since header must be a valid date string.`);
    e.status = 400;
    throw e;
  }

  if (maxItemCount && !Number.isInteger(Number(maxItemCount))) {
    const e = new Error(`The dlx-max-item-count header must be an Integer.`);
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
  hydrate(data); // do not pass model to update - it will overwrite properties that it shouldn't
  const doc = await makeRequest(updateDocument, data, userID, options);
  return scrub(hydrate(doc), userID);
};

const upsert = async (data = {}, userID, options = {}) => {
  if (!data.id) return create(data.type, data, userID);
  const model = hydrate(data);
  const doc   = await makeRequest(upsertDocument, model, userID, options);
  return scrub(hydrate(doc), userID);
};

// TYPE-SPECIFIC METHODS

const deleteLanguage = async (languageID, userID, options = {}) => {

  // delete all Lexemes for that Language
  const query = `
    SELECT * FROM items c
    WHERE
      c.type = "Lexeme"
      AND c.languageID = "${languageID}"
  `;

  const iterator = client.queryDocuments(coll, query);
  const toArray  = promisify(iterator.toArray).bind(iterator);
  const lexemes  = await toArray();

  // delete Lexemes sequentially
  lexemes.reduce((p, lex) => makeRequest(deleteDocument, lex.id, userID), Promise.resolve());

  // delete the Language
  return makeRequest(deleteDocument, languageID, userID, options);

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

  deleteLanguage,

};
