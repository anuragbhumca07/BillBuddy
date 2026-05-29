const express = require('express');
const router  = express.Router({ mergeParams: true });

const {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { authenticate, requireHouseMember } = require('../middleware/auth');
const { createAnnouncementRules, uuidParam, validate } = require('../utils/validators');

router.use(authenticate);

// GET /houses/:id/announcements
router.get('/', requireHouseMember, listAnnouncements);

// POST /houses/:id/announcements
router.post('/', requireHouseMember, createAnnouncementRules, validate, createAnnouncement);

// DELETE /announcements/:id
router.delete('/:id', [uuidParam('id'), validate], deleteAnnouncement);

module.exports = router;
