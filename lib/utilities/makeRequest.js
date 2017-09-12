/* eslint-disable
  max-statements
*/

const config = require('../config');

const msContinuationHeader = `x-ms-continuation`;

module.exports = async function makeRequest(operation, ...args) {

  try {

    const { res, headers = {} } = await operation(...args);
    if (headers[msContinuationHeader]) res.continuation = headers[msContinuationHeader];
    return res;

  } catch (err) {

    if (config.logErrors) console.error(err);

    const props = {};
    const id    = args[0] instanceof Object ? args[0].id : args[0];

    // retry the request after the given timeout
    const retry = timeout => new Promise((resolve, reject) => setTimeout(() => makeRequest(operation, args).then(resolve).catch(reject), timeout));

    // use err.substatus for 400 responses, if present, and err.code otherwise
    let status  = err.code === 400 && err.substatus ? err.substatus : err.code || 500;
    let message = `There was an error performing the database operation.`;

    switch (status) {
      case 400:
      case 401:
      {

        // treat 400 and 401 responses from CosmosDB as 500 errors
        // requests from DLx server to CosmosDB should always
        // be correctly formatted and handle exceptions

        if (config.logErrors) console.error(`FIXME: 400 response received from CosmosDB. See details above.`);

        if (err.body.includes(`Continuation`)) {
          status = 400;
          message = `Invalid continuation token.`;
        } else {
          status = 500;
        }

        break;

      }
      case 403: {
        message = `The client or user has insufficient permissions to access the resource with ID ${id}.`;
        break;
      }
      case 404: {
        message = `Resource with ID ${id} could not be found.`;
        break;
      }
      case 408: {
        if (id) message = `Timeout performing database operation on resource with ID ${id}.`;
        else message = `Timeout performing database operation.`;
        break;
      }
      case 409: {
        message = `Resource with ID ${id} already exists.`;
        break;
      }
      case 410: {
        message = `Resource with ID ${id} no longer exists.`;
        break;
      }
      case 412: {
        message = `Precondition not met for operation on resource with ID ${id}.`;
        break;
      }
      case 413: {
        if (id) message = `Resource with ID ${id} is too large.`;
        else message = `The resource provided for this operation is too large.`;
        break;
      }
      case 429: {
        // retry operation after wait time if request is throttled
        return retry(err.retryAfterInMilliseconds);
      }
      case 449: {
        // retry the operation as before
        return retry(1000);
      }
      case 503: {
        message = `The database service is unavailable. Please retry again later.`;
        break;
      }
      default: {
        break;
      }
    }

    const e = new Error(message);
    e.status = status;
    Object.assign(e, props);
    throw e;

  }

};
