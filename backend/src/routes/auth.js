const express = require('express');
const router  = express.Router();

const { register, login, logout, refresh } = require('../controllers/authController');
const { registerRules, loginRules, validate } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /auth/register
router.post('/register', authLimiter, registerRules, validate, register);

// POST /auth/login
router.post('/login', authLimiter, loginRules, validate, login);

// POST /auth/logout
router.post('/logout', logout);

// POST /auth/refresh
router.post('/refresh', refresh);

module.exports = router;
