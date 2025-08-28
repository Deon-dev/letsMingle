module.exports = function (err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
