const dlx  = require('../dlx');
const uuid = require('uuid/v4');

module.exports = (data, Model = dlx.models[data.type]) => {

  if (typeof Model === `undefined`) {
    const err = new RangeError(`Invalid type.`);
    err.status = 400;
  }

  let model;

  try {
    model = new Model(data);
  } catch (e) {
    const err = new SyntaxError(`There was a problem converting the data to DLx format: ${e.message}`);
    err.status = 422;
    throw err;
  }

  if (!model.id) model.id = uuid();

  if (!model.url) model.setURL();

  return model;

};
