module.exports = (req, res, next) => {

  console.log(`Requested URL: ${req.method} ${req.originalUrl}`);

  res.error = (status, details) => res.json({
    status: typeof status === 'string' ? 500 : status,
    error: status === 404 ? 'Not found' : 'Server error',
    error_description: typeof status === 'string' ? status : details || ''
  });

  next();

};
