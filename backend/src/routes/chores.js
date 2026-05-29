const express = require('express');
const router  = express.Router({ mergeParams: true });

const {
  listChores,
  createChore,
  getChore,
  updateChore,
  deleteChore,
  completeChore,
  getChoreHistory,
} = require('../controllers/choreController');
const { authenticate, requireHouseMember } = require('../middleware/auth');
const { createChoreRules, uuidParam, validate } = require('../utils/validators');

router.use(authenticate);

// House-scoped chore routes
// GET /houses/:id/chores
router.get('/', requireHouseMember, listChores);

// POST /houses/:id/chores
router.post('/', requireHouseMember, createChoreRules, validate, createChore);

// GET /houses/:id/chores/history
router.get('/history', requireHouseMember, getChoreHistory);

// Individual chore routes
// GET /chores/:id
router.get('/:id', [uuidParam('id'), validate], getChore);

// PUT /chores/:id
router.put('/:id', [uuidParam('id'), validate], updateChore);

// DELETE /chores/:id
router.delete('/:id', [uuidParam('id'), validate], deleteChore);

// POST /chores/:id/complete
router.post('/:id/complete', [uuidParam('id'), validate], completeChore);

module.exports = router;
