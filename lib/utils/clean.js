/**
 * This script attempts to ensure data integrity by checking for document errors
 * It also reports any cases where those errors are found, so they can be fixed
 */

/* eslint-disable
  no-console,
  no-param-reassign,
  no-underscore-dangle,
*/

const chalk = require('chalk');
const db    = require('../db');
const { client, coll } = db;
const { promisify } = require('util');

const destroy = promisify(client.deleteDocument).bind(client);
const upsert  = promisify(client.upsertDocument).bind(client);

const toDelete = [];

// fixes Languages with invalid "name" property
const cleanLanguageNames = async () => {

  console.log(`Cleaning language names`);

  const query = `
    SELECT * FROM items c
    WHERE (
      c.type = "Language"
      AND NOT IS_STRING(c.name)
    )
  `;

  const res     = client.queryDocuments(coll, query);
  const toArray = promisify(res.toArray).bind(res);
  const docs    = await toArray();

  if (docs.length) {

    console.warn(chalk.yellow(`${docs.length} Languages found with invalid "name" attribute`));

    await docs.reduce((p, doc) => p.then(() => {

      if (doc.name instanceof Object && typeof Object.values(doc.name)[0] === `string`) {
        doc.name = Object.values(doc.name)[0];
      } else {
        doc.name = ``;
      }

      return upsert(coll, doc);

    }), Promise.resolve());

    console.log(`Cleaned "name" attribute for ${docs.length} documents`);

  } else {

    console.log(chalk.green(`No Languages found with invalid "name" attribute`));

  }

};

const deleteDocs = async () => {
  if (toDelete.length) console.log(`Deleting ${toDelete.length} documents`);
  await toDelete.reduce((p, doc) => p.then(() => destroy(doc._self)), Promise.resolve());
  if (toDelete.length) console.log(`${toDelete.length} documents deleted`);
  else console.log(`No documents needed deletion.`);
};

const deleteTestDocs = () => new Promise((resolve, reject) => {

  console.log(`Retrieving test documents to delete`);

  const query = `
    SELECT * FROM items c
    WHERE c.test = true
    OR IS_DEFINED(c.testName)
    OR IS_DEFINED(c.tid)
  `;

  client.queryDocuments(coll, query).toArray((err, docs) => {
    if (err) return reject(err);
    if (docs.length) {
      console.log(`${docs.length} test documents queued for deletion`);
      toDelete.push(...docs);
    } else {
      console.log(`No test documents found for deletion.`);
    }
    resolve();
  });

});

(async () => {
  console.log(`Starting cleaning process`);
  await deleteTestDocs();
  await cleanLanguageNames();
  await deleteDocs();
  console.log(`Cleaning done`);
})();
