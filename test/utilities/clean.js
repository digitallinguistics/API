/**
 * This script attempts to ensure data integrity by checking for document errors
 * It also reports any cases where those errors are found, so they can be fixed
 */

/* eslint-disable
  no-console,
  no-param-reassign,
  no-underscore-dangle,
*/

const chalk         = require('chalk');
const db            = require('../../lib/db');
const { promisify } = require('util');

const { client, coll } = db;

const destroy = promisify(client.deleteDocument).bind(client);
const read    = promisify(client.readDocument).bind(client);
const upsert  = promisify(client.upsertDocument).bind(client);

const toDelete = [];

// fixes Languages with invalid "name" property
const cleanLanguageNames = async () => {

  console.log(`Cleaning language names`);

  const query = `
    SELECT * FROM items c
    WHERE (
      c.type = "Language"
      AND NOT IS_OBJECT(c.name)
    )
  `;

  const res     = client.queryDocuments(coll, query);
  const toArray = promisify(res.toArray).bind(res);
  const docs    = await toArray();

  if (docs.length) {

    console.warn(chalk.red(`${docs.length} Languages with invalid "name" attribute`));

    await docs.reduce((p, doc) => p.then(() => {
      doc.name = {};
      return upsert(coll, doc);
    }), Promise.resolve());

    console.log(`Cleaned "name" attribute for ${docs.length} documents`);

  } else {

    console.log(chalk.green(`No Languages found with invalid "name" attribute`));

  }

};

// deletes any documents in the toDelete Array
const deleteDocs = async () => {
  if (toDelete.length) console.log(`Deleting ${toDelete.length} documents`);
  await toDelete.reduce((p, doc) => p.then(() => destroy(doc._self)), Promise.resolve());
  if (toDelete.length) console.log(`${toDelete.length} documents deleted`);
  else console.log(`No documents needed deletion.`);
};

// queues test documents for deletion
const deleteTestDocs = async () => {

  console.log(`Retrieving test documents to delete`);

  const query = `
    SELECT * FROM items c
    WHERE c.test = true
    OR IS_DEFINED(c.testName)
    OR IS_DEFINED(c.tid)
  `;

  const res     = client.queryDocuments(coll, query);
  const toArray = promisify(res.toArray).bind(res);
  const docs    = await toArray();

  if (docs.length) {
    console.log(`${docs.length} test documents queued for deletion`);
    toDelete.push(...docs);
  } else {
    console.log(`No test documents found for deletion`);
  }

};

// queues Lexemes with non-existent Language IDs for deletion
const deleteStrandedLexemes = async () => {

  console.log(`Checking for standed Lexemes`);

  const query = `
    SELECT * FROM items c
    WHERE c.type = "Lexeme"
  `;

  const languageIDs = new Set;
  const iterator    = client.queryDocuments(coll, query);
  const toArray     = promisify(iterator.toArray).bind(iterator);
  const lexemes     = await toArray();
  let docsFound     = 0;

  await lexemes.reduce(async (p, lex) => {

    if (languageIDs.has(lex.languageID)) return;

    try {
      const lang = await read(`${coll}/docs/${lex.languageID}`);
      languageIDs.add(lang.id);
    } catch (e) {
      if (e.code === 404 || e.substatus === 404) {
        docsFound++;
        toDelete.push(lex);
      } else {
        throw e;
      }
    }

  }, Promise.resolve());

  if (docsFound.length) console.warn(chalk.red(`${docsFound} stranded Lexemes found`));
  else console.log(chalk.green(`No stranded Lexemes found`));

};

// queues docs without a "type" field for deletion
const deleteTypelessDocs = async () => {

  console.log(`Checking for documents with no "type" attribute`);

  const query = `
    SELECT * FROM items c
    WHERE NOT IS_STRING(c.type)
  `;

  const res     = client.queryDocuments(coll, query);
  const toArray = promisify(res.toArray).bind(res);
  const docs    = await toArray();

  if (docs.length) {
    console.warn(chalk.red(`${docs.length} documents found with no "type" attribute`));
    toDelete.push(...docs);
  } else {
    console.log(chalk.green(`No documents missing the "type" attribute`));
  }

};

(async () => {
  try {
    console.log(`Starting cleaning process`);
    await deleteTestDocs();
    await deleteTypelessDocs();
    await cleanLanguageNames();
    await deleteStrandedLexemes();
    await deleteDocs();
    console.log(`Cleaning done`);
  } catch (e) {
    console.error(e);
  }
})();
