const express = require('express');
const router  = express.Router();

const { getProfile, updateProfile, getUserById } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uuidParam, validate } = require('../utils/validators');

// All user routes require authentication
router.use(authenticate);

// GET /users/profile
router.get('/profile', getProfile);

// PUT /users/profile
router.put('/profile', updateProfile);

// GET /users/:id
router.get('/:id', [uuidParam('id'), validate], getUserById);

module.exports = router;
