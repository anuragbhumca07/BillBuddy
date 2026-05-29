const express = require('express');
const router  = express.Router();

const {
  createHouse,
  getMyHouse,
  getHouse,
  joinHouse,
  getHouseMembers,
  removeMember,
} = require('../controllers/houseController');
const { authenticate, requireHouseAdmin, requireHouseMember } = require('../middleware/auth');
const { query } = require('../models/db');
const {
  createHouseRules,
  joinHouseRules,
  uuidParam,
  validate,
} = require('../utils/validators');

router.use(authenticate);

// POST /houses
router.post('/', createHouseRules, validate, createHouse);

// POST /houses/join — must be before /:id
router.post('/join', joinHouseRules, validate, joinHouse);

// GET /houses/mine — return user's current house (must be before /:id)
router.get('/mine', getMyHouse);

// Middleware: for /houses/members and /houses/rules, infer houseId from user membership
const withUserHouseId = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT house_id FROM house_members WHERE user_id = $1 ORDER BY joined_at ASC LIMIT 1',
      [req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Not a member of any house' });
    }
    req.params.id = result.rows[0].house_id;
    next();
  } catch (err) {
    next(err);
  }
};

// GET /houses/members — mobile convenience route (infers house from JWT)
router.get('/members', withUserHouseId, getHouseMembers);

// DELETE /houses/members/:userId — mobile convenience route
router.delete('/members/:userId', withUserHouseId, requireHouseAdmin, removeMember);

// GET /houses/rules — mobile convenience route
const ruleController = require('../controllers/ruleController');
const { requireHouseMember: _requireMember } = require('../middleware/auth');
router.get('/rules', withUserHouseId, _requireMember, ruleController.listRules);
router.post('/rules', withUserHouseId, _requireMember, ruleController.createRule);
router.delete('/rules/:ruleId', (req, res, next) => {
  req.params.id = req.params.ruleId;
  next();
}, ruleController.deleteRule);

// GET /houses/:id
router.get('/:id', [uuidParam('id'), validate], requireHouseMember, getHouse);

// GET /houses/:id/members
router.get('/:id/members', [uuidParam('id'), validate], requireHouseMember, getHouseMembers);

// DELETE /houses/:id/members/:userId
router.delete(
  '/:id/members/:userId',
  [uuidParam('id'), uuidParam('userId'), validate],
  requireHouseAdmin,
  removeMember
);

module.exports = router;
