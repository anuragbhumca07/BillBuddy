const express = require('express');
const router  = express.Router({ mergeParams: true });

const { listRules, createRule, deleteRule } = require('../controllers/ruleController');
const { authenticate, requireHouseMember } = require('../middleware/auth');
const { createRuleRules, uuidParam, validate } = require('../utils/validators');

router.use(authenticate);

// GET /houses/:id/rules
router.get('/', requireHouseMember, listRules);

// POST /houses/:id/rules
router.post('/', requireHouseMember, createRuleRules, validate, createRule);

// DELETE /rules/:id
router.delete('/:id', [uuidParam('id'), validate], deleteRule);

module.exports = router;
