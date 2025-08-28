// utils/sanitize.js
const { xss } = require('express-xss-sanitizer');

// simple mongo key sanitizer
function mongoSanitize(req, _res, next) {
  const stripDangerousKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        stripDangerousKeys(obj[key]);
      }
    }
    return obj;
  };

  // only sanitize body + params (NOT query, since it's read-only in Express v5)
  if (req.body) stripDangerousKeys(req.body);
  if (req.params) stripDangerousKeys(req.params);

  next();
}

module.exports = { xss, mongoSanitize };




