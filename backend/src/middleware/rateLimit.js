const rateLimit = require('express-rate-limit');

// Strict for login/register (anti-bruteforce)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login/register attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

// Looser for refresh (since it's expected often)
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 refreshes per minute per IP
  standardHeaders: true,
  legacyHeaders: false
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { loginLimiter, refreshLimiter, apiLimiter };
