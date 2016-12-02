const home = (req, res) => {
  res.json({
    message: 'Hi Lindsey!',
  });
};

module.exports = { home };
