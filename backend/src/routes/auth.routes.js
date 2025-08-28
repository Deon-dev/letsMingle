const router = require('express').Router();
const { registerSchema, loginSchema } = require('../validators/schemas');
const validate = require('../middleware/validate');
const { loginLimiter, refreshLimiter } = require('../middleware/rateLimit');
const { register, login, refresh, logout } = require('../controllers/auth.controller');

// Strict limits for register/login
router.post('/register', loginLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);

// Looser limits for refresh
router.post('/refresh', refreshLimiter, refresh);

// No limiter for logout
router.post('/logout', logout);

module.exports = router;

