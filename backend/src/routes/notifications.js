const express = require('express');
const router  = express.Router();

const {
  listNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { uuidParam, validate } = require('../utils/validators');

router.use(authenticate);

// GET /notifications
router.get('/', listNotifications);

// PUT /notifications/read-all
router.put('/read-all', markAllAsRead);

// PUT /notifications/:id/read
router.put('/:id/read', [uuidParam('id'), validate], markAsRead);

module.exports = router;
