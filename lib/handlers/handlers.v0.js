const home = (req, res) => {
  res.json({
    message: 'Hi Lindsey!',
  });
};

const test = (req, res) => {
  res.status(200);
  res.json({
    status:   200,
    message: 'Test successful.',
  });
};

module.exports = {
  home,
  test,
};
