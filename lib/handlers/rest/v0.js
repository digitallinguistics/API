const db  = require(`../../db`);

const upsertLanguages = (req, res, next) => {

  const arrayParam = Array.isArray(req.body);

  const data = arrayParam ? req.body : [req.body];

  Promise.all(data.map(lang => db.upsertLanguage(lang, req.token.sub)))
  .then(languages => {
    res.status(201);
    res.json(arrayParam ? languages : languages[0]);
  })
  .catch(next);

};

module.exports = {
  upsertLanguages,
};
